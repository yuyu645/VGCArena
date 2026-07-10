require('dotenv').config();
const express = require('express');
const path = require('path');

const authRoutes = require('./server/routes/auth');
const regulationRoutes = require('./server/routes/regulations');
const teamRoutes = require('./server/routes/teams');
const ratingRoutes = require('./server/routes/ratings');
const commentRoutes = require('./server/routes/comments');
const userRoutes = require('./server/routes/users');
const staffRoutes = require('./server/routes/staff');

const { rateLimiter } = require('./server/middleware/security');

const app = express();
const PORT = process.env.PORT || 3000;

// Necesario para que req.ip refleje la IP real detrás de un proxy (Render,
// Nginx, etc.). Sin esto todas las peticiones comparten IP y el rate limiter
// se dispara para todos a la vez.
app.set('trust proxy', 1);

// Body JSON con límite: evita que un cuerpo enorme agote memoria.
app.use(express.json({ limit: '100kb' }));

// Rate limiting global y específico para autenticación.
app.use(rateLimiter(150, 15 * 60 * 1000));
app.use('/api/auth/login', rateLimiter(15, 15 * 60 * 1000, 'Demasiados intentos de inicio de sesión. Reintenta en 15 minutos.'));
app.use('/api/auth/register', rateLimiter(10, 15 * 60 * 1000, 'Demasiadas cuentas creadas desde esta IP.'));

// Estáticos.
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use(express.static(path.join(__dirname, 'public')));

// Rutas de la API.
app.use('/api/auth', authRoutes);
app.use('/api/regulations', regulationRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/teams', ratingRoutes);   // /api/teams/:id/rate
// El router de comentarios define sus rutas absolutas (/teams/:id/comments y
// /comments/:commentId), así que se monta una sola vez bajo /api.
app.use('/api', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/staff', staffRoutes);

// Cualquier /api/* no resuelto devuelve JSON, no el index.html.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Recurso no encontrado.' });
});

// El resto sirve el index.html (router SPA en el cliente).
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejador de errores: nunca filtrar el stack trace al cliente.
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

app.listen(PORT, () => {
  console.log(`VGC Arena escuchando en http://localhost:${PORT}`);
});
