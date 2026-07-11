const express = require('express');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/teams/:id/comments - Agregar comentario o respuesta
router.post('/teams/:id/comments', requireAuth, async (req, res) => {
  const teamId = req.params.id;
  const userId = req.user.id;
  const { body, parentId } = req.body;

  if (!body || body.trim() === '') {
    return res.status(400).json({ error: 'El contenido del comentario no puede estar vacío.' });
  }
  if (body.length > 1000) {
    return res.status(400).json({ error: 'El comentario no puede superar los 1000 caracteres.' });
  }

  const team = await db.findOne('teams', { id: teamId });
  if (!team) {
    return res.status(404).json({ error: 'Equipo no encontrado.' });
  }

  if (parentId) {
    const parentComment = await db.findOne('comments', { id: parentId });
    if (!parentComment) {
      return res.status(404).json({ error: 'Comentario de origen no encontrado.' });
    }
  }

  const newComment = await db.insert('comments', {
    userId,
    teamId,
    parentId: parentId || null,
    body: body.trim()
  });

  const user = await db.findOne('users', { id: userId });

  res.status(201).json({
    ...newComment,
    user: user ? { username: user.username, avatar: user.avatar } : null,
    message: 'Comentario agregado correctamente.'
  });
});

// DELETE /api/comments/:commentId - Eliminar comentario propio y todo su subárbol
router.delete('/comments/:commentId', requireAuth, async (req, res) => {
  const commentId = req.params.commentId;
  const comment = await db.findOne('comments', { id: commentId });

  if (!comment) {
    return res.status(404).json({ error: 'Comentario no encontrado.' });
  }
  if (comment.userId !== req.user.id) {
    return res.status(403).json({ error: 'No autorizado para eliminar este comentario.' });
  }

  // Recolectar el subárbol completo (hijos, nietos, ...) para no dejar
  // comentarios huérfanos: invisibles en el árbol pero contados en el total.
  const all = await db.find('comments', { teamId: comment.teamId });
  const byParent = new Map();
  for (const c of all) {
    const key = c.parentId || null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(c);
  }

  const toDelete = [];
  const stack = [commentId];
  while (stack.length) {
    const id = stack.pop();
    toDelete.push(id);
    for (const child of byParent.get(id) || []) {
      stack.push(child.id);
    }
  }

  for (const id of toDelete) {
    await db.delete('comments', { id });
  }

  res.json({ message: 'Comentario eliminado correctamente.', deleted: toDelete.length });
});

module.exports = router;
