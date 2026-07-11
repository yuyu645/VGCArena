const express = require('express');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/teams/:id/favorite - Alternar guardado de un equipo en favoritos
router.post('/:id/favorite', requireAuth, (req, res) => {
  const teamId = req.params.id;
  const userId = req.user.id;

  const team = db.findOne('teams', { id: teamId });
  if (!team) {
    return res.status(404).json({ error: 'Equipo no encontrado.' });
  }

  const existing = db.findOne('favorites', { teamId, userId });

  if (existing) {
    db.delete('favorites', { id: existing.id });
    return res.json({ favorited: false, message: 'Equipo eliminado de tus favoritos.' });
  }

  db.insert('favorites', { teamId, userId });
  res.json({ favorited: true, message: 'Equipo guardado en tus favoritos.' });
});

module.exports = router;
