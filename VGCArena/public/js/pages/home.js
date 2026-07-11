import api from '../api.js';
import skeleton from '../components/skeleton.js';
import { renderTeamCard } from '../components/team-card.js';
import { renderFilterSidebar, initFilterListeners } from '../components/filter-sidebar.js';
import toast from '../components/toast.js';

let activeFilters = {
  regSet: '',
  type: '',
  pokemon: '',
  search: '',
  sort: 'new'
};

async function homePage(params) {
  // Cargar datos asíncronamente en init
  return `
    <div>
      <!-- Hero Banner VGC Arena -->
      <section class="hero animate-fade-in">
        <div class="hero-content">
          <span class="hero-eyebrow">Comunidad competitiva VGC</span>
          <h1>Equipos ganadores,<br>compartidos por quienes los juegan</h1>
          <p class="hero-subtitle">Publica tus composiciones, recibe valoraciones de otros entrenadores y sigue de cerca el meta de cada regulación.</p>
          <div class="hero-actions">
            <a href="/team/new" data-link class="btn btn-primary">Publicar un equipo</a>
            <a href="/discover" data-link class="btn btn-secondary">Explorar el meta</a>
          </div>
        </div>
      </section>

      <!-- Layout con Feed y Filtros -->
      <div class="home-layout">
        <!-- Sidebar de Filtros -->
        <div id="filters-container">
          <div class="skeleton" style="height: 400px; border-radius: var(--radius-lg);"></div>
        </div>

        <!-- Feed Content -->
        <div>
          <div class="section-header">
            <h2 class="section-title">Equipos Compartidos</h2>
            <span id="teams-count" class="section-count">Cargando...</span>
          </div>

          <div id="feed-teams-list">
            ${skeleton.feed(4)}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Hook de inicialización llamado por el router
homePage.init = async function() {
  try {
    // Cargar regulaciones y constantes meta
    const regulationsData = await api.get('/regulations');
    const metaConstants = await api.get('/regulations/meta/constants');

    // Renderizar Filtros
    const filtersContainer = document.getElementById('filters-container');
    if (filtersContainer) {
      filtersContainer.innerHTML = renderFilterSidebar(regulationsData.regulations, metaConstants, activeFilters);
      
      // Activar listeners
      initFilterListeners(async (newFilters) => {
        activeFilters = { ...activeFilters, ...newFilters };
        await loadFeed();
      });
    }

    // Cargar equipos por primera vez
    await loadFeed();
  } catch (err) {
    console.error('Error al inicializar la página de inicio:', err);
    toast.show('Error al conectar con el servidor backend.', 'error');
  }
};

async function loadFeed() {
  const feedList = document.getElementById('feed-teams-list');
  const countLabel = document.getElementById('teams-count');
  if (!feedList) return;

  feedList.innerHTML = skeleton.feed(4);

  try {
    // Construir query string
    const queryParams = new URLSearchParams();
    if (activeFilters.search) queryParams.append('search', activeFilters.search);
    if (activeFilters.regSet) queryParams.append('regSet', activeFilters.regSet);
    if (activeFilters.type) queryParams.append('type', activeFilters.type);
    if (activeFilters.pokemon) queryParams.append('pokemon', activeFilters.pokemon);
    if (activeFilters.sort) queryParams.append('sort', activeFilters.sort);
    if (activeFilters.tag) queryParams.append('tag', activeFilters.tag);

    const data = await api.get(`/teams?${queryParams.toString()}`);
    
    if (countLabel) {
      countLabel.textContent = `${data.total} equipos encontrados`;
    }

    if (data.teams.length === 0) {
      feedList.innerHTML = `
        <div class="empty-state animate-fade-in">
          <span class="empty-state-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
          </span>
          <h3>No se encontraron equipos</h3>
          <p>Prueba limpiando los filtros o busca un término diferente.</p>
          <button id="reset-feed-filters" class="btn btn-secondary btn-sm">Limpiar Filtros</button>
        </div>
      `;
      
      const resetBtn = document.getElementById('reset-feed-filters');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          const clearBtn = document.getElementById('clear-filters-btn');
          if (clearBtn) clearBtn.click();
        });
      }
      return;
    }

    // Renderizar listado de cartas de equipos
    feedList.innerHTML = `
      <div class="teams-grid">
        ${data.teams.map((team, idx) => renderTeamCard(team, idx)).join('')}
      </div>
    `;
  } catch (err) {
    feedList.innerHTML = `<div class="card" style="border-color: var(--danger); text-align: center; padding: var(--space-5);"><p style="color: var(--danger);">Error al cargar equipos: ${err.message}</p></div>`;
  }
}

export default homePage;
