export function renderFilterSidebar(regulations = [], metaConstants = {}, activeFilters = {}) {
  const currentRegId = activeFilters.regSet || '';
  const currentType = activeFilters.type || '';
  const currentTag = activeFilters.tag || '';
  const currentSort = activeFilters.sort || 'new';
  const onlyShinys = activeFilters.onlyShinys === 'true' || activeFilters.onlyShinys === true;

  // Generar opciones de Regulations
  const regOptions = regulations
    .map(r => `<option value="${r.id}" ${r.id === currentRegId ? 'selected' : ''}>${r.name} (${r.season})</option>`)
    .join('');

  // Generar opciones de Tipos de Pokémon
  const typeOptions = (metaConstants.teraTypes || [])
    .map(t => `<option value="${t.name.toLowerCase()}" ${t.name.toLowerCase() === currentType.toLowerCase() ? 'selected' : ''}>${t.name}</option>`)
    .join('');

  // Generar tags / estilos de juego
  const tagsHTML = (metaConstants.tags || [])
    .map(tag => {
      const isActive = tag.id === currentTag;
      return `
        <button class="tag-badge" 
                data-tag-id="${tag.id}" 
                style="cursor: pointer; border: 1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}; background-color: ${isActive ? 'rgba(155, 81, 224, 0.1)' : 'var(--bg-elevated)'}; color: ${isActive ? 'var(--text-primary)' : 'var(--text-secondary)'}; margin-bottom: 4px; margin-right: 4px;">
          <span>${tag.icon}</span> <span>${tag.label}</span>
        </button>
      `;
    }).join('');

  return `
    <aside class="filter-sidebar">
      <h3 style="font-size: 1.1rem; margin-bottom: var(--space-4); display: flex; align-items: center; gap: 8px;">
        <span>🔍</span> Filtrar Equipos
      </h3>

      <!-- Búsqueda General -->
      <div class="filter-section">
        <label class="filter-section-title">Búsqueda rápida</label>
        <input type="text" id="search-input" class="form-input" placeholder="Nombre, creador o estrategia..." value="${activeFilters.search || ''}" style="padding: 6px 10px; font-size: 0.85rem;">
      </div>

      <!-- Regulation Set -->
      <div class="filter-section">
        <label class="filter-section-title">Regulation Set</label>
        <select id="filter-regset" class="form-input" style="padding: 6px 10px; font-size: 0.85rem;">
          <option value="">Todas las regulaciones</option>
          ${regOptions}
        </select>
      </div>

      <!-- Pokémon por Tipo -->
      <div class="filter-section">
        <label class="filter-section-title">Tipo de Pokémon</label>
        <select id="filter-type" class="form-input" style="padding: 6px 10px; font-size: 0.85rem;">
          <option value="">Cualquier tipo</option>
          ${typeOptions}
        </select>
      </div>

      <!-- Búsqueda específica de Pokémon -->
      <div class="filter-section">
        <label class="filter-section-title">Incluye Pokémon</label>
        <input type="text" id="filter-pokemon-name" class="form-input" placeholder="Ej. Incineroar" value="${activeFilters.pokemon || ''}" style="padding: 6px 10px; font-size: 0.85rem;">
      </div>

      <!-- Ordenar por -->
      <div class="filter-section">
        <label class="filter-section-title">Ordenar por</label>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label style="display: flex; align-items: center; gap: var(--space-2); font-size: 0.85rem; cursor: pointer;">
            <input type="radio" name="sort-group" value="new" ${currentSort === 'new' ? 'checked' : ''}> Más Reciente
          </label>
          <label style="display: flex; align-items: center; gap: var(--space-2); font-size: 0.85rem; cursor: pointer;">
            <input type="radio" name="sort-group" value="popular" ${currentSort === 'popular' ? 'checked' : ''}> Más Vistos (Popular)
          </label>
          <label style="display: flex; align-items: center; gap: var(--space-2); font-size: 0.85rem; cursor: pointer;">
            <input type="radio" name="sort-group" value="rating" ${currentSort === 'rating' ? 'checked' : ''}> Mejor Valorados
          </label>
        </div>
      </div>

      <!-- Estilo de Juego / Tags -->
      <div class="filter-section">
        <label class="filter-section-title">Estilo de Juego</label>
        <div style="display: flex; flex-wrap: wrap; margin-top: 4px;">
          ${tagsHTML}
        </div>
      </div>

      <button id="clear-filters-btn" class="btn btn-secondary btn-sm w-full" style="margin-top: var(--space-2); font-size: 0.8rem;">
        Limpiar Filtros
      </button>
    </aside>
  `;
}

// Configurar listeners
export function initFilterListeners(onFilterChange) {
  const searchInput = document.getElementById('search-input');
  const regSelect = document.getElementById('filter-regset');
  const typeSelect = document.getElementById('filter-type');
  const pokeInput = document.getElementById('filter-pokemon-name');
  const clearBtn = document.getElementById('clear-filters-btn');
  const sortRadios = document.querySelectorAll('input[name="sort-group"]');
  const tagButtons = document.querySelectorAll('.tag-badge[data-tag-id]');

  let selectedTag = '';

  function triggerChange() {
    const activeSort = Array.from(sortRadios).find(r => r.checked)?.value || 'new';
    
    onFilterChange({
      search: searchInput ? searchInput.value.trim() : '',
      regSet: regSelect ? regSelect.value : '',
      type: typeSelect ? typeSelect.value : '',
      pokemon: pokeInput ? pokeInput.value.trim() : '',
      sort: activeSort,
      tag: selectedTag
    });
  }

  // Inputs change con debouncing para texto
  let debounceTimeout;
  [searchInput, pokeInput].forEach(el => {
    if (el) {
      el.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(triggerChange, 400);
      });
    }
  });

  [regSelect, typeSelect].forEach(el => {
    if (el) el.addEventListener('change', triggerChange);
  });

  sortRadios.forEach(radio => {
    radio.addEventListener('change', triggerChange);
  });

  tagButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const tagId = this.getAttribute('data-tag-id');
      if (selectedTag === tagId) {
        selectedTag = ''; // toggle off
      } else {
        selectedTag = tagId;
      }
      triggerChange();
    });
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (regSelect) regSelect.value = '';
      if (typeSelect) typeSelect.value = '';
      if (pokeInput) pokeInput.value = '';
      if (sortRadios.length) sortRadios[0].checked = true;
      selectedTag = '';
      triggerChange();
    });
  }
}
