const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Helper para validar si un Pokémon es legal en un Regulation Set
function getRegulationAllowlist(regId) {
  const regPath = path.join(__dirname, `../../data/regulations/${regId}.json`);
  if (!fs.existsSync(regPath)) return null;
  return JSON.parse(fs.readFileSync(regPath, 'utf-8'));
}

// GET /api/teams - Feed filtrado y paginado
router.get('/', optionalAuth, (req, res) => {
  const { regSet, tag, pokemon, search, sort } = req.query;

  // Normalizar paginación: page >= 1, 1 <= limit <= 50.
  let page = parseInt(req.query.page, 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  let limit = parseInt(req.query.limit, 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 10;
  if (limit > 50) limit = 50;
  
  let teams = db.find('teams');
  
  // Enriquecer equipos con creador y pokémon
  teams = teams.map(team => {
    const creator = db.findOne('users', { id: team.userId });
    const pokemonList = db.find('team_pokemon', { teamId: team.id });
    
    return {
      ...team,
      creator: creator ? { username: creator.username, avatar: creator.avatar } : null,
      pokemon: pokemonList.sort((a, b) => a.slot - b.slot)
    };
  });

  // Aplicar filtros
  if (regSet) {
    teams = teams.filter(t => t.regSetId === regSet);
  }

  if (tag) {
    teams = teams.filter(t => t.tags && t.tags.includes(tag));
  }

  if (pokemon) {
    const pokemonNameLower = pokemon.toLowerCase();
    teams = teams.filter(t => 
      t.pokemon.some(p => p.species.toLowerCase().includes(pokemonNameLower))
    );
  }

  if (search) {
    const searchLower = search.toLowerCase();
    teams = teams.filter(t => 
      t.name.toLowerCase().includes(searchLower) ||
      (t.description || '').toLowerCase().includes(searchLower) ||
      (t.creator && t.creator.username.toLowerCase().includes(searchLower))
    );
  }

  // Ordenar
  if (sort === 'popular') {
    teams.sort((a, b) => b.viewCount - a.viewCount);
  } else if (sort === 'rating') {
    // Ordenar por promedio ponderado: (fuerza + originalidad) / 2
    teams.sort((a, b) => {
      const ratingA = ((a.avgStrength || 0) + (a.avgOriginality || 0)) / 2;
      const ratingB = ((b.avgStrength || 0) + (b.avgOriginality || 0)) / 2;
      return ratingB - ratingA;
    });
  } else {
    // por defecto: "new" (más reciente)
    teams.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Paginación
  const total = teams.length;
  const startIndex = (page - 1) * limit;
  const paginatedTeams = teams.slice(startIndex, startIndex + limit);

  res.json({
    teams: paginatedTeams,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit))
  });
});

// GET /api/teams/:id - Detalle de un equipo
router.get('/:id', optionalAuth, (req, res) => {
  const teamId = req.params.id;
  const team = db.findOne('teams', { id: teamId });

  if (!team) {
    return res.status(404).json({ error: 'Equipo no encontrado.' });
  }

  // Incrementar vistas
  db.update('teams', { id: teamId }, { viewCount: (team.viewCount || 0) + 1 });

  const creator = db.findOne('users', { id: team.userId });
  const pokemonList = db.find('team_pokemon', { teamId });
  const comments = db.find('comments', { teamId });

  // Enriquecer comentarios con creador
  const enrichedComments = comments.map(c => {
    const commentUser = db.findOne('users', { id: c.userId });
    return {
      ...c,
      user: commentUser ? { username: commentUser.username, avatar: commentUser.avatar } : null
    };
  });

  // Verificar si el usuario actual ya ha votado en este equipo
  let userRating = null;
  if (req.user) {
    userRating = db.findOne('ratings', { teamId, userId: req.user.id });
  }

  res.json({
    ...team,
    viewCount: (team.viewCount || 0) + 1,
    creator: creator ? { username: creator.username, avatar: creator.avatar, bio: creator.bio, reputation: creator.reputation } : null,
    pokemon: pokemonList.sort((a, b) => a.slot - b.slot),
    comments: enrichedComments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    userRating
  });
});

// POST /api/teams - Crear equipo
router.post('/', requireAuth, (req, res) => {
  const { name, regSetId, format, description, tags, pokemon } = req.body;

  if (!name || !regSetId || !format || !pokemon || !Array.isArray(pokemon)) {
    return res.status(400).json({ error: 'Campos del equipo incompletos.' });
  }

  if (pokemon.length !== 6) {
    return res.status(400).json({ error: 'Un equipo competitivo debe tener exactamente 6 Pokémon.' });
  }

  // Cargar allowlist del Regulation Set
  const allowlist = getRegulationAllowlist(regSetId);
  if (!allowlist) {
    return res.status(400).json({ error: 'Regulation Set inválido o no soportado.' });
  }

  // Cargar reglas de Megas
  let megaRules = {};
  try {
    const megaRulesPath = path.join(__dirname, '../../data/mega-rules.json');
    megaRules = JSON.parse(fs.readFileSync(megaRulesPath, 'utf-8'));
  } catch (err) {
    console.error('Error al cargar mega-rules.json:', err);
  }

  // Validaciones competitivas
  const speciesList = [];
  const itemsList = [];

  for (let i = 0; i < pokemon.length; i++) {
    const p = pokemon[i];
    if (!p.species || !p.pokeapiId || !p.ability || !p.teraType || !p.moves || !Array.isArray(p.moves)) {
      return res.status(400).json({ error: `Datos incompletos para el Pokémon en el slot ${i + 1}.` });
    }

    if (p.moves.length === 0 || p.moves.length > 4) {
      return res.status(400).json({ error: `El Pokémon en el slot ${i + 1} debe tener entre 1 y 4 movimientos.` });
    }

    const speciesLower = p.species.toLowerCase().trim();

    // 1. Validar megapiedra si es un Pokémon Mega
    const megaRule = megaRules[speciesLower] || Object.values(megaRules).find(r => r.baseName === speciesLower);
    const isMega = speciesLower.startsWith('mega-') || !!megaRules[speciesLower];
    
    if (isMega) {
      const rule = megaRules[speciesLower];
      if (rule) {
        const equippedItem = (p.item || '').trim().toLowerCase();
        const requiredStone = rule.stone.toLowerCase();
        if (equippedItem !== requiredStone) {
          return res.status(400).json({ 
            error: `El Pokémon ${p.species.toUpperCase()} requiere tener equipada su megapiedra específica: ${rule.stone}.` 
          });
        }
      }
    }

    // 2. Validar allowlist
    const isLegal = allowlist.pokemon.some(ap => ap.pokeapiId === p.pokeapiId);
    if (!isLegal) {
      return res.status(400).json({ error: `El Pokémon ${p.species} no es legal en ${allowlist.name}.` });
    }

    // 3. Comprobar especie duplicada (Species Clause)
    if (speciesList.includes(speciesLower)) {
      return res.status(400).json({ error: `Especie duplicada detectada: ${p.species}. No se permite repetir Pokémon.` });
    }
    speciesList.push(speciesLower);

    // 4. Comprobar objetos duplicados (Item Clause) - ignorar si no lleva objeto
    if (p.item && p.item.trim() !== '') {
      const itemLower = p.item.toLowerCase().trim();
      if (itemsList.includes(itemLower)) {
        return res.status(400).json({ error: `Objeto duplicado detectado: ${p.item}. No se permite repetir objetos.` });
      }
      itemsList.push(itemLower);
    }
  }

  // Crear registro de equipo
  const newTeam = db.insert('teams', {
    userId: req.user.id,
    name,
    regSetId,
    format,
    description: description || '',
    tags: tags || [],
    avgStrength: 0,
    avgOriginality: 0,
    totalVotes: 0,
    viewCount: 0
  });

  // Guardar los 6 Pokémon asociados al equipo
  pokemon.forEach((p, idx) => {
    db.insert('team_pokemon', {
      teamId: newTeam.id,
      slot: idx + 1,
      pokeapiId: p.pokeapiId,
      species: p.species,
      item: p.item || 'Ninguno',
      ability: p.ability,
      teraType: p.teraType,
      moves: p.moves,
      isShiny: !!p.isShiny
    });
  });

  res.status(201).json({ id: newTeam.id, message: 'Equipo publicado correctamente.' });
});

// DELETE /api/teams/:id - Eliminar equipo
router.delete('/:id', requireAuth, (req, res) => {
  const teamId = req.params.id;
  const team = db.findOne('teams', { id: teamId });

  if (!team) {
    return res.status(404).json({ error: 'Equipo no encontrado.' });
  }

  if (team.userId !== req.user.id) {
    return res.status(403).json({ error: 'No tienes permiso para eliminar este equipo.' });
  }

  // Eliminar equipo, sus pokémon, ratings y comentarios asociados
  db.delete('teams', { id: teamId });
  db.delete('team_pokemon', { teamId });
  db.delete('ratings', { teamId });
  db.delete('comments', { teamId });

  res.json({ message: 'Equipo eliminado correctamente.' });
});

module.exports = router;
