import api from '../api.js';
import skeleton from '../components/skeleton.js';
import { renderTeamCard } from '../components/team-card.js';
import { renderFilterSidebar, initFilterListeners } from '../components/filter-sidebar.js';

let activeFilters = {
  regSet: '',
  type: '',
  pokemon: '',
  search: '',
  sort: 'rating' // Por defecto para descubrir: Mayor Calificación
};

async function discoverPage(params) {
  return `
    <div>
      <div style="margin-bottom: var(--space-5);">
        <h1 style="font-size: 1.85rem;"><span class="text-gradient">Explorar Meta VGC</span></h1>
        <p style="color: var(--text-secondary); font-size: 0.95rem; margin-top: 4px;">Usa los filtros avanzados para encontrar los equipos con mejores puntuaciones o que incluyan a tus Pokémon favoritos.</p>
      </div>

      <div class="home-layout">
        <!-- Sidebar Filtros -->
        <div id="discover-filters">
          <div class="skeleton" style="height: 400px; border-radius: var(--radius-lg);"></div>
        </div>

        <!-- Resultados -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
            <h3 style="font-size: 1.2rem; font-weight: 700;">Equipos competitivos</h3>
            <span id="discover-count" style="font-size: 0.85rem; color: var(--text-tertiary);">Cargando...</span>
          </div>

          <div id="discover-teams-list">
            ${skeleton.feed(6)}
          </div>
        </div>
      </div>
    </div>
  `;
}

discoverPage.init = async function() {
  try {
    const regulationsData = await api.get('/regulations');
    const metaConstants = await api.get('/regulations/meta/constants');

    const filtersContainer = document.getElementById('discover-filters');
    if (filtersContainer) {
      filtersContainer.innerHTML = renderFilterSidebar(regulationsData.regulations, metaConstants, activeFilters);
      
      initFilterListeners(async (newFilters) => {
        activeFilters = { ...activeFilters, ...newFilters };
        await loadDiscover();
      });
    }

    await loadDiscover();
  } catch (err) {
    console.error('Error al inicializar discover:', err);
  }
};

async function loadDiscover() {
  const listEl = document.getElementById('discover-teams-list');
  const countEl = document.getElementById('discover-count');
  if (!listEl) return;

  listEl.innerHTML = skeleton.feed(6);

  try {
    const queryParams = new URLSearchParams();
    if (activeFilters.search) queryParams.append('search', activeFilters.search);
    if (activeFilters.regSet) queryParams.append('regSet', activeFilters.regSet);
    if (activeFilters.type) queryParams.append('type', activeFilters.type);
    if (activeFilters.pokemon) queryParams.append('pokemon', activeFilters.pokemon);
    if (activeFilters.sort) queryParams.append('sort', activeFilters.sort);
    if (activeFilters.tag) queryParams.append('tag', activeFilters.tag);

    const data = await api.get(`/teams?${queryParams.toString()}`);
    
    if (countEl) countEl.textContent = `${data.total} equipos encontrados`;

    if (data.teams.length === 0) {
      listEl.innerHTML = `
        <div class="card" style="text-align: center; padding: var(--space-8); border-style: dashed;">
          <span style="font-size: 3rem;">🔍</span>
          <h3 style="margin-top: var(--space-3); font-size: 1.25rem;">Sin resultados</h3>
          <p style="color: var(--text-tertiary); margin-top: var(--space-2); font-size: 0.9rem;">Prueba con otros términos o reduce los filtros.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = `
      <div class="teams-grid">
        ${data.teams.map((team, idx) => renderTeamCard(team, idx)).join('')}
      </div>
    `;
  } catch (err) {
    listEl.innerHTML = `<div class="card" style="border-color: var(--danger); text-align: center; padding: var(--space-4);"><p style="color: var(--danger);">Error: ${err.message}</p></div>`;
  }
}

export default discoverPage;
