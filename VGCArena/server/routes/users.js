const express = require('express');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const MAX_BIO_LENGTH = 500;

// Solo permitimos avatares servidos por http(s) para evitar esquemas como
// javascript:/data: que no tienen sentido como URL de imagen.
function isValidAvatarUrl(avatar) {
  return typeof avatar === 'string' && /^https?:\/\//i.test(avatar);
}

// GET /api/users/favorites/mine - Equipos guardados en favoritos por el usuario autenticado
// (debe declararse antes de /:username para que "favorites" no se interprete como un username)
router.get('/favorites/mine', requireAuth, (req, res) => {
  const favorites = db.find('favorites', { userId: req.user.id });

  const teams = favorites
    .map(fav => {
      const team = db.findOne('teams', { id: fav.teamId });
      if (!team) return null;
      const creator = db.findOne('users', { id: team.userId });
      const pokemonList = db.find('team_pokemon', { teamId: team.id });
      return {
        ...team,
        creator: creator ? { username: creator.username, avatar: creator.avatar } : null,
        pokemon: pokemonList.sort((a, b) => a.slot - b.slot),
        favoritedAt: fav.createdAt
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.favoritedAt) - new Date(a.favoritedAt));

  res.json({ teams });
});

// GET /api/users/:username - Perfil público de un entrenador
router.get('/:username', (req, res) => {
  const username = req.params.username;
  const user = db.findOne('users', { username });

  if (!user) {
    return res.status(404).json({ error: 'Entrenador no encontrado.' });
  }

  // Obtener equipos publicados por el usuario
  let teams = db.find('teams', { userId: user.id });

  // Enriquecer equipos con pokémon
  teams = teams.map(team => {
    const pokemonList = db.find('team_pokemon', { teamId: team.id });
    return {
      ...team,
      pokemon: pokemonList.sort((a, b) => a.slot - b.slot),
      creator: { username: user.username, avatar: user.avatar }
    };
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    user: {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      reputation: user.reputation,
      createdAt: user.createdAt
    },
    teams
  });
});

// PUT /api/users/profile - Editar perfil propio
router.put('/profile/edit', requireAuth, (req, res) => {
  const { bio, avatar } = req.body;

  if (bio !== undefined && bio.length > MAX_BIO_LENGTH) {
    return res.status(400).json({ error: `La biografía no puede superar los ${MAX_BIO_LENGTH} caracteres.` });
  }

  if (avatar !== undefined && avatar !== '' && !isValidAvatarUrl(avatar)) {
    return res.status(400).json({ error: 'El avatar debe ser una URL http(s) válida.' });
  }

  const updateData = {};
  if (bio !== undefined) updateData.bio = bio;
  if (avatar !== undefined) updateData.avatar = avatar;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: 'No se enviaron datos para actualizar.' });
  }

  db.update('users', { id: req.user.id }, updateData);

  const updatedUser = db.findOne('users', { id: req.user.id });

  res.json({
    message: 'Perfil actualizado con éxito.',
    user: {
      id: updatedUser.id,
      username: updatedUser.username,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      reputation: updatedUser.reputation
    }
  });
});

// POST /api/teams/:id/report - Reportar un equipo
router.post('/report/:teamId', requireAuth, (req, res) => {
  const teamId = req.params.teamId;
  const { reason } = req.body;

  if (!reason || reason.trim() === '') {
    return res.status(400).json({ error: 'Debes proporcionar una razón para el reporte.' });
  }

  const team = db.findOne('teams', { id: teamId });
  if (!team) {
    return res.status(404).json({ error: 'Equipo no encontrado.' });
  }

  // Registrar reporte
  db.insert('reports', {
    reporterId: req.user.id,
    teamId,
    reason: reason.trim(),
    status: 'pending' // pending, reviewed, dismissed
  });

  res.status(201).json({ message: 'Equipo reportado correctamente. La administración lo revisará.' });
});

module.exports = router;
