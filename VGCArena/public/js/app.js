import auth from './auth.js';
import navbar from './components/navbar.js';
import homePage from './pages/home.js';
import discoverPage from './pages/discover.js';
import teamBuilderPage from './pages/team-builder.js';
import teamDetailPage from './pages/team-detail.js';
import profilePage from './pages/profile.js';
import loginPage from './pages/login.js';
import registerPage from './pages/register.js';
import aboutPage from './pages/about.js';
import staffPage from './pages/staff.js';
import toast from './components/toast.js';

const routes = [
  { path: '/', view: homePage },
  { path: '/discover', view: discoverPage },
  { path: '/team/new', view: teamBuilderPage, authRequired: true },
  { path: '/team/:id', view: teamDetailPage },
  { path: '/profile/:username', view: profilePage },
  { path: '/login', view: loginPage },
  { path: '/register', view: registerPage },
  { path: '/about', view: aboutPage },
  { path: '/staff', view: staffPage, authRequired: true, staffRequired: true }
];

function pathToRegex(path) {
  return new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "([^/]+)") + "$");
}

function getParams(match) {
  const values = match.result.slice(1);
  const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map(result => result[1]);
  return Object.fromEntries(keys.map((key, i) => [key, values[i]]));
}

async function router() {
  const currentPath = location.pathname;

  let match = routes.map(route => {
    return {
      route,
      result: currentPath.match(pathToRegex(route.path))
    };
  }).find(potentialMatch => potentialMatch.result !== null);

  if (!match) {
    match = {
      route: { path: '/404', view: () => `<div style="text-align: center; margin-top: var(--space-8);"><h2>404 Página no encontrada</h2><p style="margin-top: var(--space-2);">Lo sentimos, el recurso que buscas no existe.</p><a href="/" data-link class="btn btn-primary" style="margin-top: var(--space-4);">Volver al inicio</a></div>` },
      result: [currentPath]
    };
  }

  // Verificar Auth general
  if (match.route.authRequired && !auth.isAuthenticated()) {
    toast.show('Debes iniciar sesión para acceder a esta sección.', 'error');
    navigateTo('/login');
    return;
  }

  // Verificar Staff específico
  if (match.route.staffRequired) {
    const user = auth.getUser();
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
      toast.show('Acceso denegado. Privilegios de Staff requeridos.', 'error');
      navigateTo('/');
      return;
    }
  }

  navbar.render();

  const appContainer = document.getElementById('app');
  appContainer.innerHTML = `<div class="skeleton w-full" style="height: 400px; border-radius: var(--radius-lg);"></div>`;

  try {
    const params = getParams(match);
    const viewHTML = await match.route.view(params);
    appContainer.innerHTML = viewHTML;
    
    if (match.route.view.init) {
      match.route.view.init(params);
    }
  } catch (err) {
    console.error('Error al renderizar página:', err);
    appContainer.innerHTML = `
      <div style="text-align: center; margin-top: var(--space-8);">
        <h2>Error al cargar la página</h2>
        <p style="margin-top: var(--space-2); color: var(--danger);">${err.message || err}</p>
        <button onclick="location.reload()" class="btn btn-secondary" style="margin-top: var(--space-4);">Reintentar</button>
      </div>
    `;
  }
}

export function navigateTo(url) {
  history.pushState(null, null, url);
  router();
}

document.addEventListener('DOMContentLoaded', async () => {
  await auth.init();

  document.body.addEventListener('click', e => {
    const link = e.target.closest('[data-link]');
    if (link) {
      e.preventDefault();
      navigateTo(link.getAttribute('href'));
    }
  });

  window.addEventListener('auth-change', () => {
    navbar.render();
    router();
  });

  window.addEventListener('popstate', router);
  router();
});
