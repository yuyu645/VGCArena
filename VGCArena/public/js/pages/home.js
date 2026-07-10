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
      <section style="background: radial-gradient(circle at 80% 20%, rgba(155, 81, 224, 0.15) 0%, rgba(0, 0, 0, 0) 60%), var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: var(--space-6) var(--space-5); margin-bottom: var(--space-6); position: relative; overflow: hidden; display: flex; align-items: center; min-height: 220px;">
        <div style="max-width: 600px; z-index: 2;">
          <span style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--accent-secondary); letter-spacing: 0.05em; display: inline-block; margin-bottom: var(--space-1);">Comunidad VGC Pokémon Champions</span>
          <h1 style="font-size: 2.2rem; font-weight: 800; line-height: 1.1; margin-bottom: var(--space-2);"><span class="text-gradient">Encuentra y comparte</span> equipos ganadores</h1>
          <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: var(--space-4);">Publica tus estrategias, recibe valoraciones de entrenadores expertos y descubre el meta para llegar a Master Ball.</p>
          <div style="display: flex; gap: var(--space-2);">
            <a href="/team/new" data-link class="btn btn-primary">Crear Equipo</a>
            <a href="/discover" data-link class="btn btn-secondary">Explorar Meta</a>
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
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
            <h2 style="font-size: 1.35rem; font-weight: 700; border-left: 4px solid var(--accent-primary); padding-left: var(--space-2);">Equipos Compartidos</h2>
            <span id="teams-count" style="font-size: 0.85rem; color: var(--text-tertiary);">Cargando...</span>
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
        <div class="card" style="text-align: center; padding: var(--space-8); border-style: dashed;">
          <span style="font-size: 3rem;">🏜️</span>
          <h3 style="margin-top: var(--space-3); font-size: 1.25rem;">No se encontraron equipos</h3>
          <p style="color: var(--text-tertiary); margin-top: var(--space-2); font-size: 0.9rem;">Prueba limpiando los filtros o busca un término diferente.</p>
          <button id="reset-feed-filters" class="btn btn-secondary btn-sm" style="margin-top: var(--space-4);">Limpiar Filtros</button>
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
