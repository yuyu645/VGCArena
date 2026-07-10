const express = require('express');
const db = require('../config/database');
const { requireStaff } = require('../middleware/auth');

const router = express.Router();

// GET /api/staff/reports - Listado de todos los reportes de moderación
router.get('/reports', requireStaff, (req, res) => {
  const reports = db.find('reports');
  
  const enrichedReports = reports.map(rep => {
    const reporter = db.findOne('users', { id: rep.reporterId });
    const team = db.findOne('teams', { id: rep.teamId });
    const teamCreator = team ? db.findOne('users', { id: team.userId }) : null;

    return {
      ...rep,
      reporterName: reporter ? reporter.username : 'Entrenador',
      teamName: team ? team.name : 'Equipo Eliminado',
      teamCreatorName: teamCreator ? teamCreator.username : 'Desconocido',
      teamExists: !!team
    };
  });

  // Ordenar por más recientes
  enrichedReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(enrichedReports);
});

// POST /api/staff/reports/:id/resolve - Resolver un reporte (archivar)
router.post('/reports/:id/resolve', requireStaff, (req, res) => {
  const reportId = req.params.id;
  const { status = 'resolved' } = req.body; // resolved, dismissed

  const report = db.findOne('reports', { id: reportId });
  if (!report) {
    return res.status(404).json({ error: 'Reporte no encontrado.' });
  }

  db.update('reports', { id: reportId }, { status });

  res.json({ message: `Reporte marcado como ${status}.` });
});

// DELETE /api/staff/teams/:id - Forzar eliminación de un equipo inapropiado por parte del staff
router.delete('/teams/:id', requireStaff, (req, res) => {
  const teamId = req.params.id;
  const team = db.findOne('teams', { id: teamId });

  if (!team) {
    return res.status(404).json({ error: 'Equipo no encontrado.' });
  }

  // Eliminar todos los datos relacionados en cascada
  db.delete('teams', { id: teamId });
  db.delete('team_pokemon', { teamId });
  db.delete('ratings', { teamId });
  db.delete('comments', { teamId });
  
  // Marcar reportes sobre este equipo como resueltos/eliminados
  db.update('reports', { teamId }, { status: 'resolved_removed' });

  res.json({ message: 'Equipo eliminado por el Staff debido a violaciones de las directrices.' });
});

module.exports = router;
