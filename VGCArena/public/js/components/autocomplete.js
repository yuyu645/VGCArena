export function setupAutocomplete(inputElement, suggestionsElement, dataSource, onSelect) {
  let currentFocus = -1;

  // Manejar el evento input
  inputElement.addEventListener('input', function() {
    const val = this.value.trim().toLowerCase();
    closeAllLists();
    
    if (!val) return;

    // dataSource puede ser un array estático o una función asíncrona
    if (typeof dataSource === 'function') {
      dataSource(val).then(list => renderSuggestions(list, val));
    } else {
      const filteredList = dataSource.filter(item => 
        (typeof item === 'string' ? item : (item.searchText || item.label || item.name || '')).toLowerCase().includes(val)
      );
      renderSuggestions(filteredList, val);
    }
  });

  // Renderizar las sugerencias en el DOM
  function renderSuggestions(list, query) {
    if (list.length === 0) {
      suggestionsElement.innerHTML = `<div style="padding: var(--space-2) var(--space-3); color: var(--text-tertiary); font-size: 0.85rem;">Sin resultados</div>`;
      suggestionsElement.style.display = 'block';
      return;
    }

    suggestionsElement.innerHTML = list.slice(0, 10).map((item, idx) => {
      const displayItem = typeof item === 'string' ? item : (item.label || item.name);
      const searchText = typeof item === 'string'
        ? item
        : (item.searchText || [item.name, item.label, ...(item.aliases || [])].filter(Boolean).join(' '));
      const index = displayItem.toLowerCase().indexOf(query) >= 0 ? displayItem.toLowerCase().indexOf(query) : searchText.toLowerCase().indexOf(query);
      const primary = typeof item === 'string' ? displayItem : (item.displayPrimary || displayItem);
      const secondary = typeof item === 'string' ? '' : (item.displaySecondary || '');
      const highlightedPrimary = index >= 0
        ? primary.substr(0, index) + "<strong>" + primary.substr(index, query.length) + "</strong>" + primary.substr(index + query.length)
        : primary;

      return `
        <div class="suggestion-item" data-index="${idx}" data-value="${displayItem}">
          <span class="suggestion-item-main">${highlightedPrimary}</span>
          ${secondary ? `<span class="suggestion-item-sub">${secondary}</span>` : ''}
        </div>
      `;
    }).join('');

    suggestionsElement.style.display = 'block';

    // Guardar los items para click/teclado
    const items = suggestionsElement.querySelectorAll('.suggestion-item');
    items.forEach((item, idx) => {
      item.addEventListener('click', function() {
        const val = this.getAttribute('data-value');
        const selectedObj = list[idx];
        inputElement.value = val;
        closeAllLists();
        onSelect(selectedObj);
      });
    });
  }

  // Soporte para teclado (flechas arriba/abajo y enter)
  inputElement.addEventListener('keydown', function(e) {
    const items = suggestionsElement.querySelectorAll('.suggestion-item');
    if (!items.length) return;

    if (e.keyCode === 40) { // DOWN
      currentFocus++;
      addActive(items);
    } else if (e.keyCode === 38) { // UP
      currentFocus--;
      addActive(items);
    } else if (e.keyCode === 13) { // ENTER
      e.preventDefault();
      if (currentFocus > -1 && items[currentFocus]) {
        items[currentFocus].click();
      }
    }
  });

  function addActive(items) {
    if (!items) return false;
    removeActive(items);
    if (currentFocus >= items.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (items.length - 1);
    
    items[currentFocus].classList.add('active');
    items[currentFocus].scrollIntoView({ block: 'nearest' });
  }

  function removeActive(items) {
    items.forEach(item => item.classList.remove('active'));
  }

  function closeAllLists() {
    suggestionsElement.innerHTML = '';
    suggestionsElement.style.display = 'none';
    currentFocus = -1;
  }

  // Cerrar al hacer click fuera
  document.addEventListener('click', function(e) {
    if (e.target !== inputElement && e.target !== suggestionsElement) {
      closeAllLists();
    }
  });
}
