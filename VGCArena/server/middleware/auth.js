const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

function requireStaff(req, res, next) {
  requireAuth(req, res, async () => {
    const db = require('../config/database');
    const user = await db.findOne('users', { id: req.user.id });
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
      return res.status(403).json({ error: 'Acceso denegado. Privilegios de Staff requeridos.' });
    }
    next();
  });
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Ignorar error de token inválido en rutas opcionales
    }
  }
  next();
}

module.exports = { requireAuth, requireStaff, optionalAuth };
