import pokeapi from '../pokeapi-cache.js';
import { setupAutocomplete } from './autocomplete.js';
import toast from './toast.js';
import {
  canonicalizeAbilityName,
  canonicalizeItemName,
  canonicalizeMoveName,
  canonicalizeNatureName,
  getAbilityEntries,
  getAbilityLabel,
  getItemEntries,
  getItemLabel,
  getNatureEntries,
  getNatureLabel,
  getStatDefinitions,
  getStatLabel,
  getTypeLabel,
  getMoveEntries,
  getMoveLabel,
  getMoveLanguage
} from '../move-localization.js';
import { getSpriteUrl } from '../mega-data.js';

function getBaseStatValue(baseStats, statKey) {
  if (!baseStats) return 0;
  if (Array.isArray(baseStats)) {
    const found = baseStats.find(stat => stat && (stat.stat?.name === statKey || stat.key === statKey));
    return found ? (found.base_stat ?? found.value ?? 0) : 0;
  }

  if (typeof baseStats === 'object') {
    return baseStats[statKey] ?? baseStats[statKey.replace(/-/g, '_')] ?? 0;
  }

  return 0;
}

function getEvValue(evs, statKey) {
  if (!evs || typeof evs !== 'object') return 0;
  return Number(evs[statKey] ?? evs[statKey.replace(/-/g, '_')] ?? 0) || 0;
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

  const abilitiesOptions = getAbilityEntries(pokemonData.availableAbilities || [])
    .map(a => `<option value="${a.name}" ${pokemonData.ability === a.name ? 'selected' : ''}>${a.label}</option>`)
    .join('');

  const teraOptions = (metaConstants.teraTypes || [])
    .map(t => `<option value="${t.name}" ${pokemonData.teraType === t.name ? 'selected' : ''}>${getTypeLabel(t.name)}</option>`)
    .join('');
  const moveLanguage = getMoveLanguage();
  const statDefinitions = getStatDefinitions(moveLanguage);
  const natureOptions = getNatureEntries()
    .map(n => `<option value="${n.name}" ${((pokemonData.nature || 'hardy') === n.name) ? 'selected' : ''}>${n.label}</option>`)
    .join('');
  const baseStats = pokemonData.baseStats || {};
  const evs = pokemonData.evs || {};
  const totalEvs = statDefinitions.reduce((sum, stat) => sum + getEvValue(evs, stat.key), 0);

  const spriteUrl = getSpriteUrl(pokemonData.pokeapiId, pokemonData.species, pokemonData.isShiny);

  return `
    <div id="${containerId}" class="builder-card-slot filled" style="gap: var(--space-3); width: 100%;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
        <div style="display: flex; gap: var(--space-2); align-items: center;">
          <img id="slot-sprite-${slotIndex}" src="${spriteUrl}" alt="${pokemonData.species}" style="width: 72px; height: 72px; object-fit: contain;">
          <div>
            <h4 style="text-transform: uppercase; font-size: 1.1rem; color: var(--text-primary);">${pokemonData.species}</h4>
            <div style="display: flex; gap: 4px; margin-top: 4px;">
              ${(pokemonData.types || []).map(t => `<span class="type-badge" title="${getTypeLabel(t)}" style="background-color: var(--type-${t.toLowerCase()}); padding: 1px 4px; font-size: 0.65rem;">${t.substr(0,3)}</span>`).join('')}
            </div>
          </div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="window.builderPage.removePokemon(${slotIndex})" title="Quitar Pokémon" style="padding: 4px 8px;">✕</button>
      </div>

      <!-- Habilidad -->
      <div class="form-group" style="width: 100%; margin-bottom: 0;">
        <label class="form-label" style="font-size: 0.75rem; margin-bottom: 2px;">Habilidad / Ability</label>
        <select class="form-input" style="padding: var(--space-1) var(--space-2); font-size: 0.85rem;" onchange="window.builderPage.updatePokemonField(${slotIndex}, 'ability', this.value)">
          <option value="">Selecciona habilidad / Select ability</option>
          ${abilitiesOptions}
        </select>
      </div>

      <!-- Objeto -->
      <div class="form-group" style="width: 100%; margin-bottom: 0; position: relative;">
        <label class="form-label" style="font-size: 0.75rem; margin-bottom: 2px;">Objeto / Item</label>
        <div class="autocomplete-wrapper">
          <input type="text" class="form-input" id="item-input-${slotIndex}" value="${pokemonData.item || ''}" placeholder="Ej. Focus Sash / Banda Focus" style="padding: var(--space-1) var(--space-2); font-size: 0.85rem;" autocomplete="off">
          <div class="autocomplete-suggestions" id="item-suggestions-${slotIndex}" style="display: none;"></div>
        </div>
      </div>

      <!-- Tipo Tera -->
      <div class="form-group" style="width: 100%; margin-bottom: 0;">
        <label class="form-label" style="font-size: 0.75rem; margin-bottom: 2px;">Tipo Tera / Tera Type</label>
        <select class="form-input" style="padding: var(--space-1) var(--space-2); font-size: 0.85rem;" onchange="window.builderPage.updatePokemonField(${slotIndex}, 'teraType', this.value)">
          <option value="">Selecciona Tera / Select Tera</option>
          ${teraOptions}
        </select>
      </div>

      <!-- Movimientos -->
      <div style="width: 100%;">
        <label class="form-label" style="font-size: 0.75rem; margin-bottom: var(--space-1);">Movimientos / Moves (máx 4)</label>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
          ${[0, 1, 2, 3].map(moveIdx => `
            <div class="autocomplete-wrapper" style="width: 100%;">
              <input type="text" 
                     class="form-input" 
                     id="move-input-${slotIndex}-${moveIdx}" 
                value="${pokemonData.moves && pokemonData.moves[moveIdx] ? getMoveLabel(pokemonData.moves[moveIdx], moveLanguage) : ''}" 
                     placeholder="Mov ${moveIdx + 1}" 
                     style="padding: 4px 6px; font-size: 0.8rem;" 
                     autocomplete="off">
              <div class="autocomplete-suggestions" id="move-suggestions-${slotIndex}-${moveIdx}" style="display: none;"></div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Naturaleza -->
      <div class="form-group" style="width: 100%; margin-bottom: 0;">
        <label class="form-label" style="font-size: 0.75rem; margin-bottom: 2px;">Naturaleza / Nature</label>
        <select class="form-input" style="padding: var(--space-1) var(--space-2); font-size: 0.85rem;" onchange="window.builderPage.updatePokemonField(${slotIndex}, 'nature', this.value)">
          ${natureOptions}
        </select>
      </div>

      <!-- Estadísticas base y EVs -->
      <div class="form-group" style="width: 100%; margin-bottom: 0;">
        <label class="form-label" style="font-size: 0.75rem; margin-bottom: 2px;">Stats base / EVs</label>
        <div style="border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: var(--space-2); background: var(--bg-void); display: grid; gap: var(--space-2);">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
            ${statDefinitions.map(stat => `
              <div style="display: flex; flex-direction: column; gap: 2px; padding: 6px 8px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm);">
                <span style="font-size: 0.7rem; color: var(--text-tertiary);">${stat.label}</span>
                <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-primary);">Base ${getBaseStatValue(baseStats, stat.key)}</span>
              </div>
            `).join('')}
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
            ${statDefinitions.map(stat => `
              <label style="display: flex; flex-direction: column; gap: 2px; padding: 6px 8px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm);">
                <span style="font-size: 0.7rem; color: var(--text-tertiary);">EV ${stat.shortLabel}</span>
                <input type="number" min="0" max="32" step="4" value="${getEvValue(evs, stat.key)}" onchange="window.builderPage.updatePokemonEV(${slotIndex}, '${stat.key}', this.value)" style="padding: 4px 6px; font-size: 0.82rem;">
              </label>
            `).join('')}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; gap: var(--space-2); flex-wrap: wrap; font-size: 0.75rem; color: var(--text-secondary);">
            <span>Total EVs: <strong style="color: var(--text-primary);">${totalEvs}/66</strong></span>
            <span>Máximo 32 EV por estadística.</span>
          </div>
        </div>
      </div>

      <!-- Shiny Toggle -->
      <div style="display: flex; align-items: center; gap: var(--space-2); width: 100%; margin-top: auto; padding-top: var(--space-1);">
        <input type="checkbox" id="shiny-toggle-${slotIndex}" ${pokemonData.isShiny ? 'checked' : ''} onchange="window.builderPage.toggleShiny(${slotIndex}, this.checked)">
        <label for="shiny-toggle-${slotIndex}" style="font-size: 0.8rem; cursor: pointer; user-select: none;">Variocolor (Shiny)</label>
      </div>
    </div>
  `;
}

export function initSlotAutocompletes(slotIndex, pokemonData, metaConstants) {
  if (!pokemonData) return;

  const itemInput = document.getElementById(`item-input-${slotIndex}`);
  const itemSuggestions = document.getElementById(`item-suggestions-${slotIndex}`);
  if (itemInput && itemSuggestions) {
    const itemEntries = getItemEntries(metaConstants.items || []);
    setupAutocomplete(itemInput, itemSuggestions, itemEntries, (selectedItem) => {
      window.builderPage.updatePokemonField(slotIndex, 'item', canonicalizeItemName(selectedItem.name || selectedItem));
    });
    itemInput.addEventListener('blur', function() {
      setTimeout(() => {
        window.builderPage.updatePokemonField(slotIndex, 'item', canonicalizeItemName(this.value.trim()));
      }, 200);
    });
  }

  for (let moveIdx = 0; moveIdx < 4; moveIdx++) {
    const moveInput = document.getElementById(`move-input-${slotIndex}-${moveIdx}`);
    const moveSuggestions = document.getElementById(`move-suggestions-${slotIndex}-${moveIdx}`);
    const moveEntries = getMoveEntries(pokemonData.availableMoves || []);
    
    if (moveInput && moveSuggestions) {
      setupAutocomplete(moveInput, moveSuggestions, moveEntries, (selectedMove) => {
        window.builderPage.updatePokemonMove(slotIndex, moveIdx, selectedMove.name || selectedMove);
      });
      moveInput.addEventListener('blur', function() {
        setTimeout(() => {
          window.builderPage.updatePokemonMove(slotIndex, moveIdx, canonicalizeMoveName(this.value.trim()));
        }, 200);
      });
    }
  }
}
