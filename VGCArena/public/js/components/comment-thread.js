import api from '../api.js';
import auth from '../auth.js';
import toast from './toast.js';
import { escapeHTML, safeAvatar, encodePath } from '../utils.js';

const commentThread = {
  render(containerId, teamId, comments = []) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const isAuth = auth.isAuthenticated();
    const currentUser = auth.getUser();

    // 1. Organizar comentarios en un árbol (nidos)
    const roots = [];
    const childrenMap = {};

    comments.forEach(c => {
      if (c.parentId) {
        if (!childrenMap[c.parentId]) childrenMap[c.parentId] = [];
        childrenMap[c.parentId].push(c);
      } else {
        roots.push(c);
      }
    });

    // Helper recursivo para renderizar un comentario y sus respuestas
    function renderCommentNode(c, depth = 0) {
      const children = childrenMap[c.id] || [];
      const hasReplies = children.length > 0;
      const isOwner = currentUser && currentUser.id === c.userId;
      const timeStr = new Date(c.createdAt).toLocaleDateString('es-ES', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      const replyBtnHTML = isAuth 
        ? `<button class="btn btn-secondary btn-sm" onclick="window.commentThread.showReplyForm('${c.id}')" style="padding: 2px 6px; font-size: 0.75rem;">Responder</button>`
        : '';

      const deleteBtnHTML = isOwner
        ? `<button class="btn btn-danger btn-sm" onclick="window.commentThread.deleteComment('${c.id}', '${teamId}')" style="padding: 2px 6px; font-size: 0.75rem;">Eliminar</button>`
        : '';

      const avatar = safeAvatar(c.user ? c.user.avatar : null);
      const author = escapeHTML(c.user ? c.user.username : 'Entrenador');
      const authorPath = encodePath(c.user ? c.user.username : 'Entrenador');

      return `
        <div class="comment-item ${depth > 0 ? 'reply' : ''}" id="comment-${c.id}" style="margin-left: ${depth * 24}px; margin-top: var(--space-2);">
          <div class="comment-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <img src="${avatar}" alt="${author}" style="width: 20px; height: 20px; border-radius: 50%;">
              <a href="/profile/${authorPath}" data-link style="font-weight: 700; color: var(--text-primary);">@${author}</a>
              <span style="color: var(--text-tertiary); font-size: 0.75rem;">${timeStr}</span>
            </div>
            <div style="display: flex; gap: var(--space-2);">
              ${replyBtnHTML}
              ${deleteBtnHTML}
            </div>
          </div>
          <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 4px; line-height: 1.5; white-space: pre-wrap;">${escapeHTML(c.body)}</p>
          
          <!-- Contenedor para el formulario de respuesta dinámico -->
          <div id="reply-form-container-${c.id}"></div>
        </div>
        ${children.map(child => renderCommentNode(child, Math.min(depth + 1, 3))).join('')}
      `;
    }

    const commentsListHTML = comments.length === 0
      ? `<p style="color: var(--text-tertiary); text-align: center; padding: var(--space-4);">No hay comentarios aún. ¡Sé el primero en dejar una nota!</p>`
      : roots.map(root => renderCommentNode(root, 0)).join('');

    // Caja de input principal para nuevo comentario raíz
    const rootInputHTML = isAuth
      ? `
        <div class="comment-input-area card" style="background-color: var(--bg-elevated); margin-bottom: var(--space-5);">
          <h4 style="font-size: 0.95rem; margin-bottom: var(--space-2);">Escribe un comentario</h4>
          <textarea id="root-comment-body" class="form-input" rows="3" placeholder="Comparte tus sugerencias de mejoras de movimientos, objetos alternativos o sinergias competitivas..." style="resize: vertical; margin-bottom: var(--space-2);"></textarea>
          <div style="display: flex; justify-content: flex-end;">
            <button id="submit-root-comment" class="btn btn-primary btn-sm">Publicar Comentario</button>
          </div>
        </div>
      `
      : `
        <div class="card" style="text-align: center; padding: var(--space-4); margin-bottom: var(--space-5); border-style: dashed;">
          <p style="font-size: 0.9rem; color: var(--text-secondary);">Debes <a href="/login" data-link>iniciar sesión</a> o <a href="/register" data-link>registrarte</a> para comentar.</p>
        </div>
      `;

    container.innerHTML = `
      <div>
        <h3 style="font-size: 1.25rem; margin-bottom: var(--space-4);">Comentarios (${comments.length})</h3>
        ${rootInputHTML}
        <div id="comments-list-wrapper">
          ${commentsListHTML}
        </div>
      </div>
    `;

    // Asignar listeners del comentario raíz
    if (isAuth) {
      const submitBtn = document.getElementById('submit-root-comment');
      const textInput = document.getElementById('root-comment-body');
      
      if (submitBtn && textInput) {
        submitBtn.addEventListener('click', async () => {
          const body = textInput.value.trim();
          if (!body) return;

          try {
            submitBtn.disabled = true;
            const newC = await api.post(`/teams/${teamId}/comments`, { body });
            textInput.value = '';
            
            // Refrescar el hilo insertando el nuevo comentario
            comments.push(newC);
            commentThread.render(containerId, teamId, comments);
            toast.show('¡Comentario publicado!', 'success');
          } catch (err) {
            toast.show(err.message || 'Error al publicar comentario', 'error');
            submitBtn.disabled = false;
          }
        });
      }
    }

    // Exponer helpers al objeto window para poder llamarlos desde atributos inline HTML
    window.commentThread = {
      showReplyForm(commentId) {
        const formContainer = document.getElementById(`reply-form-container-${commentId}`);
        if (!formContainer) return;

        // Si ya está abierto, cerrarlo
        if (formContainer.innerHTML !== '') {
          formContainer.innerHTML = '';
          return;
        }

        formContainer.innerHTML = `
          <div style="margin-top: var(--space-3); padding: var(--space-2); background-color: var(--bg-void); border-radius: var(--radius-sm); border: 1px solid var(--border-default);">
            <textarea id="reply-body-${commentId}" class="form-input" rows="2" placeholder="Escribe tu respuesta..." style="resize: vertical; font-size: 0.85rem; padding: 6px 10px; margin-bottom: 6px;"></textarea>
            <div style="display: flex; justify-content: flex-end; gap: var(--space-2);">
              <button class="btn btn-secondary btn-sm" onclick="document.getElementById('reply-form-container-${commentId}').innerHTML = ''" style="padding: 2px 8px; font-size: 0.75rem;">Cancelar</button>
              <button class="btn btn-primary btn-sm" onclick="window.commentThread.submitReply('${commentId}', '${teamId}', '${containerId}')" style="padding: 2px 8px; font-size: 0.75rem;">Enviar</button>
            </div>
          </div>
        `;
        document.getElementById(`reply-body-${commentId}`).focus();
      },

      async submitReply(parentId, teamId, containerId) {
        const replyInput = document.getElementById(`reply-body-${parentId}`);
        if (!replyInput) return;
        const body = replyInput.value.trim();
        if (!body) return;

        try {
          const newC = await api.post(`/teams/${teamId}/comments`, { body, parentId });
          
          // Agregar al array local de comentarios y re-renderizar
          comments.push(newC);
          commentThread.render(containerId, teamId, comments);
          toast.show('Respuesta publicada con éxito', 'success');
        } catch (err) {
          toast.show(err.message || 'Error al enviar respuesta', 'error');
        }
      },

      async deleteComment(commentId, teamId) {
        if (!confirm('¿Estás seguro de que deseas eliminar este comentario? También se borrarán sus respuestas.')) return;

        try {
          await api.delete(`/comments/${commentId}`);
          
          // Remover del array local y re-renderizar
          const filteredComments = comments.filter(c => c.id !== commentId && c.parentId !== commentId);
          commentThread.render(containerId, teamId, filteredComments);
          toast.show('Comentario eliminado', 'success');
        } catch (err) {
          toast.show(err.message || 'Error al eliminar comentario', 'error');
        }
      }
    };
  }
};

export default commentThread;
