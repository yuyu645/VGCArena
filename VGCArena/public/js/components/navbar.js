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
        <div class="user-menu-wrapper">
          <button id="user-menu-btn" class="btn btn-secondary btn-sm" aria-haspopup="true" aria-expanded="false">
            <img src="${safeAvatar(user.avatar)}" alt="" class="user-avatar">
            <span>${escapeHTML(user.username)}</span>
            <span aria-hidden="true" style="font-size: 0.6rem; color: var(--text-tertiary);">▼</span>
          </button>
          <div id="user-dropdown" class="user-dropdown" style="display: none;">
            <a href="/profile/${encodeURIComponent(user.username)}" data-link class="nav-dropdown-item">Mi Perfil</a>
            <a href="/team/new" data-link class="nav-dropdown-item">Publicar Equipo</a>
            ${isStaff ? `<a href="/staff" data-link class="nav-dropdown-item" style="color: var(--warning);">Panel Staff</a>` : ''}
            <hr class="nav-dropdown-divider">
            <button id="logout-btn" class="nav-dropdown-danger">Cerrar Sesión</button>
          </div>
        </div>
      `;
    }

    navbarRoot.innerHTML = `
      <nav class="navbar" aria-label="Navegación principal">
        <div class="container nav-container">
          <a href="/" data-link class="logo" aria-label="VGC Arena — Inicio">
            <span class="logo-mark" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h6"/><path d="M15 12h6"/><circle cx="12" cy="12" r="3"/></svg>
            </span>
            <span>VGC</span><span>ARENA</span>
          </a>
          <div class="nav-links" id="nav-links">
            <a href="/" data-link class="nav-link ${location.pathname === '/' ? 'active' : ''}">Feed</a>
            <a href="/discover" data-link class="nav-link ${location.pathname === '/discover' ? 'active' : ''}">Descubrir</a>
            <a href="/about" data-link class="nav-link ${location.pathname === '/about' ? 'active' : ''}">Info</a>
            ${isAuth ? `<a href="/team/new" data-link class="nav-link ${location.pathname === '/team/new' ? 'active' : ''}">Nuevo Equipo</a>` : ''}
            ${isStaff ? `<a href="/staff" data-link class="nav-link ${location.pathname === '/staff' ? 'active' : ''}">Staff</a>` : ''}
            ${!isAuth ? `
              <a href="/login" data-link class="nav-link nav-link-mobile ${location.pathname === '/login' ? 'active' : ''}">Ingresar</a>
              <a href="/register" data-link class="nav-link nav-link-mobile ${location.pathname === '/register' ? 'active' : ''}">Registrarse</a>
            ` : ''}
          </div>
          <div class="nav-actions">
            ${userSectionHTML}
            <button id="nav-toggle" class="nav-toggle" aria-expanded="false" aria-controls="nav-links" aria-label="Abrir menú de navegación">
              <span class="nav-toggle-bar"></span>
              <span class="nav-toggle-bar"></span>
              <span class="nav-toggle-bar"></span>
            </button>
          </div>
        </div>
      </nav>
    `;

    // Menú móvil (hamburguesa)
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    if (navToggle && navLinks) {
      navToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = navLinks.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
        document.body.classList.toggle('nav-open', isOpen);
      });

      // Cerrar al navegar o hacer click fuera
      navLinks.addEventListener('click', (e) => {
        if (e.target.closest('[data-link]')) {
          navLinks.classList.remove('open');
          navToggle.setAttribute('aria-expanded', 'false');
          document.body.classList.remove('nav-open');
        }
      });
      document.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      });
    }

    // Hook events
    if (isAuth) {
      const menuBtn = document.getElementById('user-menu-btn');
      const dropdown = document.getElementById('user-dropdown');

      if (menuBtn && dropdown) {
        menuBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const willOpen = dropdown.style.display === 'none';
          dropdown.style.display = willOpen ? 'block' : 'none';
          menuBtn.setAttribute('aria-expanded', String(willOpen));
        });

        document.addEventListener('click', () => {
          dropdown.style.display = 'none';
          menuBtn.setAttribute('aria-expanded', 'false');
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
