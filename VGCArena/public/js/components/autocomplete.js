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
        item.toLowerCase().includes(val)
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
      const displayItem = typeof item === 'string' ? item : item.name;
      // Resaltar la coincidencia
      const index = displayItem.toLowerCase().indexOf(query);
      let highlighted = displayItem;
      if (index >= 0) {
        highlighted = displayItem.substr(0, index) + 
          "<strong>" + displayItem.substr(index, query.length) + "</strong>" + 
          displayItem.substr(index + query.length);
      }

      return `
        <div class="suggestion-item" data-index="${idx}" data-value="${displayItem}">
          ${highlighted}
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
