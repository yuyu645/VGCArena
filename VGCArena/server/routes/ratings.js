const express = require('express');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/teams/:id/rate - Valorar un equipo (Fuerza competitiva + Originalidad)
router.post('/:id/rate', requireAuth, (req, res) => {
  const teamId = req.params.id;
  const userId = req.user.id;
  const { strength, originality } = req.body;

  const strengthVal = Number(strength);
  const originalityVal = Number(originality);

  if (isNaN(strengthVal) || strengthVal < 1 || strengthVal > 5 ||
      isNaN(originalityVal) || originalityVal < 1 || originalityVal > 5) {
    return res.status(400).json({ error: 'Las valoraciones deben estar entre 1 y 5 estrellas.' });
  }

  const team = db.findOne('teams', { id: teamId });
  if (!team) {
    return res.status(404).json({ error: 'Equipo no encontrado.' });
  }

  // Comprobar si ya existe una valoración de este usuario
  const existingRating = db.findOne('ratings', { teamId, userId });

  if (existingRating) {
    // Actualizar voto existente
    db.update('ratings', { id: existingRating.id }, {
      strength: strengthVal,
      originality: originalityVal
    });
  } else {
    // Insertar nuevo voto
    db.insert('ratings', {
      userId,
      teamId,
      strength: strengthVal,
      originality: originalityVal
    });
  }

  // Recalcular medias del equipo
  const allRatings = db.find('ratings', { teamId });
  const totalVotes = allRatings.length;
  
  const sumStrength = allRatings.reduce((sum, r) => sum + r.strength, 0);
  const sumOriginality = allRatings.reduce((sum, r) => sum + r.originality, 0);

  const avgStrength = Number((sumStrength / totalVotes).toFixed(2));
  const avgOriginality = Number((sumOriginality / totalVotes).toFixed(2));

  // Actualizar equipo
  db.update('teams', { id: teamId }, {
    avgStrength,
    avgOriginality,
    totalVotes
  });

  // Recalcular reputación del creador del equipo
  // Fórmula: La suma de (fuerza * originalidad) de todos los votos en todos sus equipos
  const creatorId = team.userId;
  const creatorTeams = db.find('teams', { userId: creatorId });
  let newReputation = 0;

  creatorTeams.forEach(t => {
    const tRatings = db.find('ratings', { teamId: t.id });
    tRatings.forEach(r => {
      // Un voto excelente (5/5 en ambos ejes) aporta hasta 25 pts de reputación
      newReputation += (r.strength * r.originality);
    });
  });

  db.update('users', { id: creatorId }, { reputation: newReputation });

  res.json({
    message: 'Valoración registrada con éxito.',
    avgStrength,
    avgOriginality,
    totalVotes,
    creatorReputation: newReputation
  });
});

module.exports = router;
