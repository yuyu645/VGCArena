import api from '../api.js';
import { escapeHTML, safeAvatar, encodePath } from '../utils.js';
import auth from '../auth.js';
import { renderTeamCard } from '../components/team-card.js';
import toast from '../components/toast.js';

let profileUser = null;

async function profilePage(params) {
  return `
    <div id="profile-container">
      <div class="skeleton" style="height: 250px; border-radius: var(--radius-lg); margin-bottom: var(--space-5);"></div>
      <div class="skeleton" style="height: 400px; border-radius: var(--radius-lg);"></div>
    </div>

    <!-- Modal para Editar Perfil -->
    <div id="edit-profile-modal" class="modal">
      <div class="modal-content">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
          <h3 style="font-size: 1.25rem;">Editar Mi Perfil</h3>
          <button class="btn btn-secondary btn-sm" onclick="window.profilePage.closeEditModal()" style="padding: 4px 8px;">✕</button>
        </div>
        
        <form id="edit-profile-form" onsubmit="event.preventDefault();">
          <div class="form-group">
            <label class="form-label">Avatar URL (o avatar dinámico DiceBear)</label>
            <input type="url" id="edit-avatar-url" class="form-input" placeholder="https://ejemplo.com/mi-avatar.png">
            <span style="font-size: 0.75rem; color: var(--text-tertiary); display: block; margin-top: 4px;">Puedes usar cualquier enlace de imagen directa o dejar en blanco.</span>
          </div>

          <div class="form-group">
            <label class="form-label">Biografía Corta</label>
            <textarea id="edit-bio" class="form-input" rows="3" placeholder="Cuéntale a la comunidad sobre tu trayectoria en VGC, tus metas competitivas o tus Pokémon favoritos..."></textarea>
          </div>

          <div style="margin-top: var(--space-5); display: flex; justify-content: flex-end; gap: var(--space-2);">
            <button type="button" class="btn btn-secondary" onclick="window.profilePage.closeEditModal()">Cancelar</button>
            <button type="submit" id="save-profile-btn" class="btn btn-primary">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

profilePage.init = async function(params) {
  const container = document.getElementById('profile-container');
  if (!container) return;

  const username = params.username;

  try {
    const data = await api.get(`/users/${username}`);
    profileUser = data.user;

    const currentUser = auth.getUser();
    const isSelf = currentUser && currentUser.username === profileUser.username;

    // Formatear fecha
    const joinDate = new Date(profileUser.createdAt).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long'
    });

    const editBtnHTML = isSelf 
      ? `<button class="btn btn-secondary btn-sm" onclick="window.profilePage.openEditModal()" style="margin-top: var(--space-2);">⚙️ Editar Perfil</button>`
      : '';

    // Renderizar listado de equipos del perfil
    const teamsHTML = data.teams.length === 0
      ? `<div class="card" style="text-align: center; padding: var(--space-8); border-style: dashed;">
          <span style="font-size: 2.5rem;">🎒</span>
          <h4 style="margin-top: var(--space-2);">Este entrenador no ha publicado equipos competitivos aún.</h4>
         </div>`
      : `<div class="teams-grid">
          ${data.teams.map((team, idx) => renderTeamCard(team, idx)).join('')}
         </div>`;

    container.innerHTML = `
      <div>
        <!-- Panel de Perfil -->
        <div class="card animate-fade-in" style="background: radial-gradient(circle at 10% 20%, rgba(155, 81, 224, 0.1) 0%, rgba(0, 0, 0, 0) 40%), var(--bg-surface); padding: var(--space-5); margin-bottom: var(--space-6); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-4);">
          <div style="display: flex; align-items: center; gap: var(--space-4); flex-wrap: wrap;">
            <img src="${safeAvatar(profileUser.avatar)}" alt="${escapeHTML(profileUser.username)}" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid var(--accent-primary); box-shadow: var(--shadow-glow);">
            <div>
              <h2 style="font-size: 1.75rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                @${escapeHTML(profileUser.username)}
                <span class="tag-badge" style="background-color: var(--accent-primary); color: #fff; font-size: 0.75rem; font-weight: bold; border: none;">Entrenador</span>
              </h2>
              <p style="color: var(--text-tertiary); font-size: 0.8rem; margin-top: 2px;">Miembro desde: ${joinDate}</p>
              <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: var(--space-2); max-width: 500px;">${escapeHTML(profileUser.bio)}</p>
              ${editBtnHTML}
            </div>
          </div>
          
          <div style="background-color: var(--bg-elevated); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: var(--space-3) var(--space-5); text-align: center; min-width: 140px;">
            <div style="font-size: 2.2rem; font-weight: 800; color: var(--accent-secondary); line-height: 1;">🏆 ${profileUser.reputation}</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.05em;">Reputación VGC</div>
          </div>
        </div>

        <!-- Equipos del Entrenador -->
        <div>
          <h3 style="font-size: 1.25rem; margin-bottom: var(--space-4); border-left: 4px solid var(--accent-primary); padding-left: var(--space-2);">
            Equipos Publicados (${data.teams.length})
          </h3>
          ${teamsHTML}
        </div>
      </div>
    `;

    // Event handler para guardar perfil
    if (isSelf) {
      const editForm = document.getElementById('edit-profile-form');
      if (editForm) {
        editForm.addEventListener('submit', saveProfile);
      }
    }
  } catch (err) {
    console.error('Error al inicializar el perfil:', err);
    container.innerHTML = `<div class="card" style="border-color: var(--danger); text-align: center; padding: var(--space-5);"><p style="color: var(--danger);">Error al cargar perfil de usuario: ${err.message}</p></div>`;
  }
};

window.profilePage = {
  openEditModal() {
    const modal = document.getElementById('edit-profile-modal');
    const avatarInput = document.getElementById('edit-avatar-url');
    const bioInput = document.getElementById('edit-bio');

    if (avatarInput) avatarInput.value = profileUser.avatar;
    if (bioInput) bioInput.value = profileUser.bio;

    if (modal) modal.classList.add('active');
  },

  closeEditModal() {
    const modal = document.getElementById('edit-profile-modal');
    if (modal) modal.classList.remove('active');
  }
};

async function saveProfile() {
  const avatarInput = document.getElementById('edit-avatar-url');
  const bioInput = document.getElementById('edit-bio');
  const saveBtn = document.getElementById('save-profile-btn');

  try {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';

    const res = await api.put('/users/profile/edit', {
      avatar: avatarInput.value.trim() || undefined,
      bio: bioInput.value.trim()
    });

    // Actualizar localStorage y auth helper
    localStorage.setItem('vgc_user', JSON.stringify(res.user));
    
    toast.show('Perfil actualizado con éxito.', 'success');
    window.profilePage.closeEditModal();
    
    // Recargar página para mostrar datos actualizados
    profilePage.init({ username: profileUser.username });
  } catch (err) {
    toast.show(err.message || 'Error al guardar perfil.', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Guardar Cambios';
  }
}

export default profilePage;
