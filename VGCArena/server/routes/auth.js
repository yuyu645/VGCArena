const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { JWT_SECRET } = require('../config/env');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Da forma al objeto de usuario público (nunca incluye passwordHash).
function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role || 'user',
    avatar: user.avatar,
    bio: user.bio,
    reputation: user.reputation
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role || 'user' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Registro
router.post('/register', (req, res) => {
  const { username, email, password, bio, avatar } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Usuario, email y contraseña son requeridos.' });
  }

  if (db.findOne('users', { username })) {
    return res.status(400).json({ error: 'El nombre de usuario ya está registrado.' });
  }
  if (db.findOne('users', { email })) {
    return res.status(400).json({ error: 'El email ya está registrado.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser = db.insert('users', {
    username,
    email,
    passwordHash,
    role: 'user',
    avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
    bio: bio || '',
    reputation: 0
  });

  res.status(201).json({ token: signToken(newUser), user: toPublicUser(newUser) });
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
  }

  const user = db.findOne('users', { username });
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }

  res.json({ token: signToken(user), user: toPublicUser(user) });
});

// Obtener sesión actual
router.get('/me', requireAuth, (req, res) => {
  const user = db.findOne('users', { id: req.user.id });
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }
  res.json(toPublicUser(user));
});

module.exports = router;
