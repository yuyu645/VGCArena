import auth from '../auth.js';
import { escapeHTML, safeAvatar } from '../utils.js';

const navbar = {
  render() {
    const navbarRoot = document.getElementById('navbar-root');
    if (!navbarRoot) return;

    const user = auth.getUser();
    const isAuth = auth.isAuthenticated();
    const isStaff = isAuth && (user.role === 'staff' || user.role === 'admin');

    let userSectionHTML = `
      <a href="/login" data-link class="btn btn-secondary btn-sm">Ingresar</a>
      <a href="/register" data-link class="btn btn-primary btn-sm">Registrarse</a>
    `;

    if (isAuth) {
      userSectionHTML = `
        <div class="user-menu-wrapper" style="position: relative; display: inline-block;">
          <button id="user-menu-btn" class="btn btn-secondary btn-sm" style="display: flex; align-items: center; gap: 8px;">
            <img src="${safeAvatar(user.avatar)}" alt="Avatar" style="width: 24px; height: 24px; border-radius: 50%;">
            <span>${escapeHTML(user.username)}</span>
            <span style="font-size: 0.7rem; color: var(--text-tertiary);">▼</span>
          </button>
          <div id="user-dropdown" class="card" style="display: none; position: absolute; top: 110%; right: 0; min-width: 180px; z-index: 150; padding: var(--space-2); background-color: var(--bg-elevated); box-shadow: var(--shadow-lg);">
            <a href="/profile/${encodeURIComponent(user.username)}" data-link class="nav-dropdown-item" style="display: block; padding: var(--space-2); font-weight: 500; border-radius: var(--radius-sm);">Mi Perfil</a>
            <a href="/team/new" data-link class="nav-dropdown-item" style="display: block; padding: var(--space-2); font-weight: 500; border-radius: var(--radius-sm);">Publicar Equipo</a>
            ${isStaff ? `<a href="/staff" data-link class="nav-dropdown-item" style="display: block; padding: var(--space-2); font-weight: 500; border-radius: var(--radius-sm); color: var(--warning);">Panel Staff</a>` : ''}
            <hr style="border: 0; border-top: 1px solid var(--border-subtle); margin: var(--space-1) 0;">
            <button id="logout-btn" style="width: 100%; text-align: left; background: none; border: none; cursor: pointer; color: var(--danger); display: block; padding: var(--space-2); font-weight: 500; border-radius: var(--radius-sm);">Cerrar Sesión</button>
          </div>
        </div>
      `;
    }

    navbarRoot.innerHTML = `
      <nav class="navbar">
        <div class="container nav-container">
          <a href="/" data-link class="logo">
            <span class="text-gradient" style="font-weight: 800;">VGC</span><span>ARENA</span>
          </a>
          <div class="nav-links">
            <a href="/" data-link class="nav-link ${location.pathname === '/' ? 'active' : ''}">Feed</a>
            <a href="/discover" data-link class="nav-link ${location.pathname === '/discover' ? 'active' : ''}">Descubrir</a>
            <a href="/about" data-link class="nav-link ${location.pathname === '/about' ? 'active' : ''}">Info</a>
            ${isAuth ? `<a href="/team/new" data-link class="nav-link ${location.pathname === '/team/new' ? 'active' : ''}">Nuevo Equipo</a>` : ''}
            ${isStaff ? `<a href="/staff" data-link class="nav-link ${location.pathname === '/staff' ? 'active' : ''}">Staff</a>` : ''}
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            ${userSectionHTML}
          </div>
        </div>
      </nav>
    `;

    // Hook events
    if (isAuth) {
      const menuBtn = document.getElementById('user-menu-btn');
      const dropdown = document.getElementById('user-dropdown');
      
      if (menuBtn && dropdown) {
        menuBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });

        document.addEventListener('click', () => {
          dropdown.style.display = 'none';
        });
      }

      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          auth.logout();
          window.location.href = '/';
        });
      }
    }
  }
};

export default navbar;
