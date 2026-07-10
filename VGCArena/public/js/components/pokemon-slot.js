import pokeapi from '../pokeapi-cache.js';
import { setupAutocomplete } from './autocomplete.js';
import toast from './toast.js';

// Mapeo síncrono para sprites de megas en el constructor
function getSpriteUrl(pokeapiId, speciesName, isShiny) {
  let id = pokeapiId;
  const species = (speciesName || '').toLowerCase().trim();
  
  const megaBaseIds = {
    "mega-venusaur": 3, "mega-charizard-x": 6, "mega-charizard-y": 6, "mega-blastoise": 9,
    "mega-beedrill": 15, "mega-pidgeot": 18, "mega-alakazam": 65, "mega-slowbro": 80,
    "mega-gengar": 94, "mega-kangaskhan": 115, "mega-pinsir": 127, "mega-gyarados": 130,
    "mega-aerodactyl": 142, "mega-ampharos": 181, "mega-scizor": 212, "mega-heracross": 214,
    "mega-houndoom": 229, "mega-tyranitar": 248, "mega-blaziken": 257, "mega-gardevoir": 282,
    "mega-mawile": 303, "mega-aggron": 306, "mega-medicham": 308, "mega-manectric": 310,
    "mega-sharpedo": 319, "mega-camerupt": 323, "mega-altaria": 334, "mega-banette": 354,
    "mega-absol": 359, "mega-glalie": 362, "mega-metagross": 376, "mega-lopunny": 428,
    "mega-garchomp": 445, "mega-lucario": 448, "mega-abomasnow": 460, "mega-steelix": 208,
    "mega-sceptile": 254, "mega-swampert": 260, "mega-sableye": 302, "mega-meganium": 154,
    "mega-excadrill": 530, "mega-greninja": 658, "mega-skarmory": 227, "mega-chimecho": 358,
    "mega-chandelure": 609, "mega-golurk": 623, "mega-victreebel": 71, "mega-starmie": 121,
    "mega-raichu-x": 26, "mega-raichu-y": 26, "mega-staraptor": 398, "mega-scolipede": 545,
    "mega-scrafty": 560, "mega-drampa": 780, "mega-froslass": 478, "mega-emboar": 500,
    "mega-chesnaught": 652, "mega-delphox": 655, "mega-dragonite": 149, "mega-eelektross": 604,
    "mega-pyroar": 668, "mega-eternal-floette": 670, "mega-garchomp-z": 445
  };
  
  if (megaBaseIds[species]) {
    id = megaBaseIds[species];
  }
  
  return isShiny
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export function renderPokemonSlot(slotIndex, pokemonData = null, allowlist = [], metaConstants = {}) {
  const isFilled = pokemonData !== null;
  const containerId = `builder-slot-${slotIndex}`;
  
  if (!isFilled) {
    return `
      <div id="${containerId}" class="builder-card-slot" onclick="window.builderPage.openPickPokemonModal(${slotIndex})">
        <span style="font-size: 2.5rem; color: var(--text-tertiary); margin-bottom: var(--space-2);">+</span>
        <span style="font-weight: 600; color: var(--text-secondary);">Añadir Pokémon</span>
        <span style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: var(--space-1);">Slot ${slotIndex}</span>
      </div>
    `;
  }

  const abilitiesOptions = (pokemonData.availableAbilities || [])
    .map(a => `<option value="${a}" ${pokemonData.ability === a ? 'selected' : ''}>${a}</option>`)
    .join('');

  const teraOptions = (metaConstants.teraTypes || [])
    .map(t => `<option value="${t.name}" ${pokemonData.teraType === t.name ? 'selected' : ''}>${t.name}</option>`)
    .join('');

  const spriteUrl = getSpriteUrl(pokemonData.pokeapiId, pokemonData.species, pokemonData.isShiny);

  return `
    <div id="${containerId}" class="builder-card-slot filled" style="gap: var(--space-3); width: 100%;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
        <div style="display: flex; gap: var(--space-2); align-items: center;">
          <img id="slot-sprite-${slotIndex}" src="${spriteUrl}" alt="${pokemonData.species}" style="width: 72px; height: 72px; object-fit: contain;">
          <div>
            <h4 style="text-transform: uppercase; font-size: 1.1rem; color: var(--text-primary);">${pokemonData.species}</h4>
            <div style="display: flex; gap: 4px; margin-top: 4px;">
              ${(pokemonData.types || []).map(t => `<span class="type-badge" style="background-color: var(--type-${t.toLowerCase()}); padding: 1px 4px; font-size: 0.65rem;">${t.substr(0,3)}</span>`).join('')}
            </div>
          </div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="window.builderPage.removePokemon(${slotIndex})" title="Quitar Pokémon" style="padding: 4px 8px;">✕</button>
      </div>

      <!-- Habilidad -->
      <div class="form-group" style="width: 100%; margin-bottom: 0;">
        <label class="form-label" style="font-size: 0.75rem; margin-bottom: 2px;">Habilidad</label>
        <select class="form-input" style="padding: var(--space-1) var(--space-2); font-size: 0.85rem;" onchange="window.builderPage.updatePokemonField(${slotIndex}, 'ability', this.value)">
          <option value="">Selecciona habilidad</option>
          ${abilitiesOptions}
        </select>
      </div>

      <!-- Objeto -->
      <div class="form-group" style="width: 100%; margin-bottom: 0; position: relative;">
        <label class="form-label" style="font-size: 0.75rem; margin-bottom: 2px;">Objeto</label>
        <div class="autocomplete-wrapper">
          <input type="text" class="form-input" id="item-input-${slotIndex}" value="${pokemonData.item || ''}" placeholder="Ej. Focus Sash" style="padding: var(--space-1) var(--space-2); font-size: 0.85rem;" autocomplete="off">
          <div class="autocomplete-suggestions" id="item-suggestions-${slotIndex}" style="display: none;"></div>
        </div>
      </div>

      <!-- Tipo Tera -->
      <div class="form-group" style="width: 100%; margin-bottom: 0;">
        <label class="form-label" style="font-size: 0.75rem; margin-bottom: 2px;">Tipo Tera</label>
        <select class="form-input" style="padding: var(--space-1) var(--space-2); font-size: 0.85rem;" onchange="window.builderPage.updatePokemonField(${slotIndex}, 'teraType', this.value)">
          <option value="">Selecciona Tera</option>
          ${teraOptions}
        </select>
      </div>

      <!-- Movimientos -->
      <div style="width: 100%;">
        <label class="form-label" style="font-size: 0.75rem; margin-bottom: var(--space-1);">Movimientos (máx 4)</label>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
          ${[0, 1, 2, 3].map(moveIdx => `
            <div class="autocomplete-wrapper" style="width: 100%;">
              <input type="text" 
                     class="form-input" 
                     id="move-input-${slotIndex}-${moveIdx}" 
                     value="${pokemonData.moves && pokemonData.moves[moveIdx] ? pokemonData.moves[moveIdx] : ''}" 
                     placeholder="Mov ${moveIdx + 1}" 
                     style="padding: 4px 6px; font-size: 0.8rem;" 
                     autocomplete="off">
              <div class="autocomplete-suggestions" id="move-suggestions-${slotIndex}-${moveIdx}" style="display: none;"></div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Shiny Toggle -->
      <div style="display: flex; align-items: center; gap: var(--space-2); width: 100%; margin-top: auto; padding-top: var(--space-1);">
        <input type="checkbox" id="shiny-toggle-${slotIndex}" ${pokemonData.isShiny ? 'checked' : ''} onchange="window.builderPage.toggleShiny(${slotIndex}, this.checked)">
        <label for="shiny-toggle-${slotIndex}" style="font-size: 0.8rem; cursor: pointer; user-select: none;">✨ Variocolor (Shiny)</label>
      </div>
    </div>
  `;
}

export function initSlotAutocompletes(slotIndex, pokemonData, metaConstants) {
  if (!pokemonData) return;

  const itemInput = document.getElementById(`item-input-${slotIndex}`);
  const itemSuggestions = document.getElementById(`item-suggestions-${slotIndex}`);
  if (itemInput && itemSuggestions) {
    setupAutocomplete(itemInput, itemSuggestions, metaConstants.items || [], (selectedItem) => {
      window.builderPage.updatePokemonField(slotIndex, 'item', selectedItem);
    });
    itemInput.addEventListener('blur', function() {
      setTimeout(() => {
        window.builderPage.updatePokemonField(slotIndex, 'item', this.value.trim());
      }, 200);
    });
  }

  for (let moveIdx = 0; moveIdx < 4; moveIdx++) {
    const moveInput = document.getElementById(`move-input-${slotIndex}-${moveIdx}`);
    const moveSuggestions = document.getElementById(`move-suggestions-${slotIndex}-${moveIdx}`);
    
    if (moveInput && moveSuggestions) {
      setupAutocomplete(moveInput, moveSuggestions, pokemonData.availableMoves || [], (selectedMove) => {
        window.builderPage.updatePokemonMove(slotIndex, moveIdx, selectedMove);
      });
      moveInput.addEventListener('blur', function() {
        setTimeout(() => {
          window.builderPage.updatePokemonMove(slotIndex, moveIdx, this.value.trim());
        }, 200);
      });
    }
  }
}
