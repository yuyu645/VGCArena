const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Los slugs de regulación válidos solo contienen minúsculas, dígitos y guiones
// (coincide con reg-h, reg-m-b, etc.) — evita path traversal al construir la ruta del archivo.
const VALID_REG_ID = /^[a-z0-9-]+$/;

const STAT_KEYS = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
const MAX_EV_PER_STAT = 32;
const MAX_EV_TOTAL = 66;
const VALID_NATURES = new Set([
  'hardy', 'lonely', 'brave', 'adamant', 'naughty',
  'bold', 'docile', 'relaxed', 'impish', 'lax',
  'timid', 'hasty', 'serious', 'jolly', 'naive',
  'modest', 'mild', 'quiet', 'bashful', 'rash',
  'calm', 'gentle', 'sassy', 'careful', 'quirky'
]);

// Helper para validar si un Pokémon es legal en un Regulation Set
function getRegulationAllowlist(regId) {
  if (typeof regId !== 'string' || !VALID_REG_ID.test(regId)) return null;
  const regPath = path.join(__dirname, `../../data/regulations/${regId}.json`);
  if (!fs.existsSync(regPath)) return null;
  return JSON.parse(fs.readFileSync(regPath, 'utf-8'));
}

function loadMegaRules() {
  try {
    const megaRulesPath = path.join(__dirname, '../../data/mega-rules.json');
    return JSON.parse(fs.readFileSync(megaRulesPath, 'utf-8'));
  } catch (err) {
    console.error('Error al cargar mega-rules.json:', err);
    return {};
  }
}

function normalizeEvs(rawEvs) {
  const evs = {};
  for (const key of STAT_KEYS) {
    const val = Number(rawEvs && rawEvs[key]);
    evs[key] = Number.isFinite(val) ? Math.max(0, Math.min(MAX_EV_PER_STAT, Math.floor(val))) : 0;
  }
  return evs;
}

// Valida la lista de 6 Pokémon de un equipo contra las reglas competitivas
// (allowlist de la regulación, Species/Item Clause, megapiedra obligatoria, EVs).
// Devuelve { error } si algo falla, o null si todo es válido.
function validateTeamPokemon(pokemon, allowlist) {
  const megaRules = loadMegaRules();
  const speciesList = [];
  const itemsList = [];

  for (let i = 0; i < pokemon.length; i++) {
    const p = pokemon[i];
    if (!p.species || !p.pokeapiId || !p.ability || !p.teraType || !p.moves || !Array.isArray(p.moves)) {
      return { error: `Datos incompletos para el Pokémon en el slot ${i + 1}.` };
    }

    if (p.moves.length === 0 || p.moves.length > 4) {
      return { error: `El Pokémon en el slot ${i + 1} debe tener entre 1 y 4 movimientos.` };
    }

    if (p.nature !== undefined && !VALID_NATURES.has(String(p.nature).toLowerCase())) {
      return { error: `Naturaleza inválida para el Pokémon en el slot ${i + 1}.` };
    }

    if (p.evs !== undefined) {
      const rawExceedsPerStat = STAT_KEYS.some(key => Number(p.evs[key]) > MAX_EV_PER_STAT);
      if (rawExceedsPerStat) {
        return { error: `El Pokémon ${p.species} supera el máximo de ${MAX_EV_PER_STAT} EVs en una sola estadística.` };
      }
      const evs = normalizeEvs(p.evs);
      const total = STAT_KEYS.reduce((sum, key) => sum + evs[key], 0);
      if (total > MAX_EV_TOTAL) {
        return { error: `El Pokémon ${p.species} supera el máximo de ${MAX_EV_TOTAL} EVs totales.` };
      }
    }

    const speciesLower = p.species.toLowerCase().trim();

    // 1. Validar megapiedra si es un Pokémon Mega
    const isMega = speciesLower.startsWith('mega-') || !!megaRules[speciesLower];
    if (isMega) {
      const rule = megaRules[speciesLower];
      if (rule) {
        const equippedItem = (p.item || '').trim().toLowerCase();
        const requiredStone = rule.stone.toLowerCase();
        if (equippedItem !== requiredStone) {
          return { error: `El Pokémon ${p.species.toUpperCase()} requiere tener equipada su megapiedra específica: ${rule.stone}.` };
        }
      }
    }

    // 2. Validar allowlist
    const isLegal = allowlist.pokemon.some(ap => ap.pokeapiId === p.pokeapiId);
    if (!isLegal) {
      return { error: `El Pokémon ${p.species} no es legal en ${allowlist.name}.` };
    }

    // 3. Comprobar especie duplicada (Species Clause)
    if (speciesList.includes(speciesLower)) {
      return { error: `Especie duplicada detectada: ${p.species}. No se permite repetir Pokémon.` };
    }
    speciesList.push(speciesLower);

    // 4. Comprobar objetos duplicados (Item Clause) - ignorar si no lleva objeto
    if (p.item && p.item.trim() !== '') {
      const itemLower = p.item.toLowerCase().trim();
      if (itemsList.includes(itemLower)) {
        return { error: `Objeto duplicado detectado: ${p.item}. No se permite repetir objetos.` };
      }
      itemsList.push(itemLower);
    }
  }

  return null;
}

// GET /api/teams - Feed filtrado y paginado
router.get('/', optionalAuth, async (req, res) => {
  const { regSet, tag, pokemon, search, sort } = req.query;

  // Normalizar paginación: page >= 1, 1 <= limit <= 50.
  let page = parseInt(req.query.page, 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  let limit = parseInt(req.query.limit, 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 10;
  if (limit > 50) limit = 50;

  const allTeams = await db.find('teams');

  // Enriquecer equipos con creador y pokémon
  let teams = await Promise.all(allTeams.map(async team => {
    const creator = await db.findOne('users', { id: team.userId });
    const pokemonList = await db.find('team_pokemon', { teamId: team.id });

    return {
      ...team,
      creator: creator ? { username: creator.username, avatar: creator.avatar } : null,
      pokemon: pokemonList.sort((a, b) => a.slot - b.slot)
    };
  }));

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
router.get('/:id', optionalAuth, async (req, res) => {
  const teamId = req.params.id;
  const team = await db.findOne('teams', { id: teamId });

  if (!team) {
    return res.status(404).json({ error: 'Equipo no encontrado.' });
  }

  // Incrementar vistas
  const updatedViewCount = (team.viewCount || 0) + 1;
  await db.update('teams', { id: teamId }, { viewCount: updatedViewCount });

  const creator = await db.findOne('users', { id: team.userId });
  const pokemonList = await db.find('team_pokemon', { teamId });
  const comments = await db.find('comments', { teamId });

  // Enriquecer comentarios con creador
  const enrichedComments = await Promise.all(comments.map(async c => {
    const commentUser = await db.findOne('users', { id: c.userId });
    return {
      ...c,
      user: commentUser ? { username: commentUser.username, avatar: commentUser.avatar } : null
    };
  }));

  // Verificar si el usuario actual ya ha votado y/o guardado en favoritos este equipo
  let userRating = null;
  let isFavorited = false;
  if (req.user) {
    userRating = await db.findOne('ratings', { teamId, userId: req.user.id });
    isFavorited = !!(await db.findOne('favorites', { teamId, userId: req.user.id }));
  }

  res.json({
    ...team,
    viewCount: updatedViewCount,
    creator: creator ? { username: creator.username, avatar: creator.avatar, bio: creator.bio, reputation: creator.reputation } : null,
    pokemon: pokemonList.sort((a, b) => a.slot - b.slot),
    comments: enrichedComments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    userRating,
    isFavorited
  });
});

// POST /api/teams - Crear equipo
router.post('/', requireAuth, async (req, res) => {
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

  const validationError = validateTeamPokemon(pokemon, allowlist);
  if (validationError) {
    return res.status(400).json(validationError);
  }

  // Crear registro de equipo
  const newTeam = await db.insert('teams', {
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
  for (let idx = 0; idx < pokemon.length; idx++) {
    const p = pokemon[idx];
    await db.insert('team_pokemon', {
      teamId: newTeam.id,
      slot: idx + 1,
      pokeapiId: p.pokeapiId,
      species: p.species,
      types: Array.isArray(p.types) ? p.types : [],
      item: p.item || 'Ninguno',
      ability: p.ability,
      teraType: p.teraType,
      moves: p.moves,
      isShiny: !!p.isShiny,
      baseStats: (p.baseStats && typeof p.baseStats === 'object') ? p.baseStats : {},
      evs: normalizeEvs(p.evs),
      nature: (p.nature && VALID_NATURES.has(String(p.nature).toLowerCase())) ? p.nature.toLowerCase() : 'hardy'
    });
  }

  res.status(201).json({ id: newTeam.id, message: 'Equipo publicado correctamente.' });
});

// PUT /api/teams/:id - Editar un equipo propio
router.put('/:id', requireAuth, async (req, res) => {
  const teamId = req.params.id;
  const team = await db.findOne('teams', { id: teamId });

  if (!team) {
    return res.status(404).json({ error: 'Equipo no encontrado.' });
  }

  if (team.userId !== req.user.id) {
    return res.status(403).json({ error: 'No tienes permiso para editar este equipo.' });
  }

  const { name, regSetId, format, description, tags, pokemon } = req.body;

  if (!name || !regSetId || !format || !pokemon || !Array.isArray(pokemon)) {
    return res.status(400).json({ error: 'Campos del equipo incompletos.' });
  }

  if (pokemon.length !== 6) {
    return res.status(400).json({ error: 'Un equipo competitivo debe tener exactamente 6 Pokémon.' });
  }

  const allowlist = getRegulationAllowlist(regSetId);
  if (!allowlist) {
    return res.status(400).json({ error: 'Regulation Set inválido o no soportado.' });
  }

  const validationError = validateTeamPokemon(pokemon, allowlist);
  if (validationError) {
    return res.status(400).json(validationError);
  }

  await db.update('teams', { id: teamId }, {
    name,
    regSetId,
    format,
    description: description || '',
    tags: tags || []
  });

  // Reemplazar los Pokémon del equipo
  await db.delete('team_pokemon', { teamId });
  for (let idx = 0; idx < pokemon.length; idx++) {
    const p = pokemon[idx];
    await db.insert('team_pokemon', {
      teamId,
      slot: idx + 1,
      pokeapiId: p.pokeapiId,
      species: p.species,
      types: Array.isArray(p.types) ? p.types : [],
      item: p.item || 'Ninguno',
      ability: p.ability,
      teraType: p.teraType,
      moves: p.moves,
      isShiny: !!p.isShiny,
      baseStats: (p.baseStats && typeof p.baseStats === 'object') ? p.baseStats : {},
      evs: normalizeEvs(p.evs),
      nature: (p.nature && VALID_NATURES.has(String(p.nature).toLowerCase())) ? p.nature.toLowerCase() : 'hardy'
    });
  }

  res.json({ id: teamId, message: 'Equipo actualizado correctamente.' });
});

// DELETE /api/teams/:id - Eliminar equipo
router.delete('/:id', requireAuth, async (req, res) => {
  const teamId = req.params.id;
  const team = await db.findOne('teams', { id: teamId });

  if (!team) {
    return res.status(404).json({ error: 'Equipo no encontrado.' });
  }

  if (team.userId !== req.user.id) {
    return res.status(403).json({ error: 'No tienes permiso para eliminar este equipo.' });
  }

  // Eliminar equipo, sus pokémon, ratings y comentarios asociados
  await db.delete('teams', { id: teamId });
  await db.delete('team_pokemon', { teamId });
  await db.delete('ratings', { teamId });
  await db.delete('comments', { teamId });

  res.json({ message: 'Equipo eliminado correctamente.' });
});

module.exports = router;
