import api from '../api.js';
import pokeapi from '../pokeapi-cache.js';
import { renderPokemonSlot, initSlotAutocompletes } from '../components/pokemon-slot.js';
import { setupAutocomplete } from '../components/autocomplete.js';
import toast from '../components/toast.js';
import { navigateTo } from '../app.js';
import { canonicalizeMoveName, getMoveLanguage, setMoveLanguage, warmAbilityTranslations, warmItemTranslations, warmMoveTranslations, warmNatureTranslations, warmTypeTranslations } from '../move-localization.js';
import { megaBaseIds } from '../mega-data.js';
import auth from '../auth.js';

let regulations = [];
let metaConstants = {};
let selectedRegSetId = 'reg-h';
let teamSlots = Array(6).fill(null);
let activeModalSlot = null;
let editingTeamId = null;

async function teamBuilderPage(params) {
  const isEditing = !!(params && params.id);
  return `
    <div>
      <div style="margin-bottom: var(--space-5); display: flex; justify-content: space-between; align-items: end; gap: var(--space-3); flex-wrap: wrap;">
        <div>
          <h1 style="font-size: 1.85rem;">${isEditing ? 'Editar Equipo' : 'Constructor de equipos'}</h1>
          <p style="color: var(--text-secondary); font-size: 0.95rem; margin-top: 4px;">${isEditing ? 'Modifica tu equipo publicado y guarda los cambios.' : 'Crea tu alineación competitiva de 6 Pokémon legales según la regulación oficial de Ranked.'}</p>
        </div>
        <button id="move-language-toggle" class="btn btn-secondary btn-sm" type="button" onclick="window.builderPage.toggleMoveLanguage()"></button>
      </div>

      <form id="builder-form" onsubmit="event.preventDefault();">
        <div class="card" style="margin-bottom: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4);">
          <h3 style="font-size: 1.2rem; border-left: 4px solid var(--accent-primary); padding-left: var(--space-2);">1. Información General</h3>
          
          <div class="builder-info-row">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Nombre del Equipo</label>
              <input type="text" id="team-name" class="form-input" placeholder="Ej. Rain Offense Reg H, Trick Room Stall..." required>
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Regulation Set</label>
              <select id="team-regset" class="form-input" style="cursor: pointer;">
              </select>
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Formato</label>
              <select id="team-format" class="form-input" style="cursor: pointer;">
                <option value="Ranked">Ranked Battles</option>
                <option value="Casual">Casual Battles</option>
                <option value="Torneo">Torneo / Open Team Sheet</option>
              </select>
            </div>
          </div>

          <div id="regset-incomplete-banner" style="display: none; background: var(--bg-elevated); border: 1px solid var(--accent-warning, #d9a441); border-radius: var(--radius-md, 6px); padding: var(--space-3); font-size: 0.85rem; color: var(--text-secondary);">
            ⚠️ Los datos de Pokémon legales de este Regulation Set son parciales (dataset de origen incompleto). Es posible que falten especies legales.
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Estrategia / Guía de uso (Descripción)</label>
            <textarea id="team-desc" class="form-input" rows="3" placeholder="Describe los roles de tus Pokémon, sinergias comunes, leads habituales y cómo enfrentarse a arquetipos populares del meta..." style="resize: vertical;"></textarea>
          </div>

          <div>
            <label class="form-label">Etiquetas de Estilo de Juego</label>
            <div id="tags-checkboxes" style="display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: 6px;">
            </div>
          </div>
        </div>

        <div style="margin-bottom: var(--space-5);">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); flex-wrap: wrap;">
            <h3 style="font-size: 1.2rem; border-left: 4px solid var(--accent-primary); padding-left: var(--space-2);">2. Miembros del Equipo (6 Pokémon)</h3>
            <span style="font-size: 0.8rem; color: var(--text-tertiary);">Habilidad, objeto, tipo y movimientos se muestran en ambos idiomas.</span>
          </div>
          
          <div class="builder-grid" id="builder-pokemon-slots">
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-6);">
          <a href="/" data-link class="btn btn-secondary">Cancelar</a>
          <button id="publish-team-btn" class="btn btn-primary" style="font-size: 1.05rem;">${isEditing ? 'Guardar Cambios' : 'Publicar Equipo'}</button>
        </div>
      </form>

      <div id="add-pokemon-modal" class="modal">
        <div class="modal-content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
            <h3 style="font-size: 1.25rem;">Añadir Pokémon (Slot <span id="modal-slot-title">-</span>)</h3>
            <button class="btn btn-secondary btn-sm" onclick="window.builderPage.closePickPokemonModal()" style="padding: 4px 8px;">✕</button>
          </div>
          
          <div class="form-group" style="position: relative;">
            <label class="form-label">Especie (Solo legales en Regulation Set)</label>
            <div class="autocomplete-wrapper">
              <input type="text" id="modal-poke-search" class="form-input" placeholder="Escribe el nombre del Pokémon..." autocomplete="off">
              <div class="autocomplete-suggestions" id="modal-poke-suggestions" style="display: none;"></div>
            </div>
          </div>
          
          <div style="margin-top: var(--space-4); display: flex; justify-content: flex-end; gap: var(--space-2);">
            <button class="btn btn-secondary" onclick="window.builderPage.closePickPokemonModal()">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

teamBuilderPage.init = async function(params) {
  teamSlots = Array(6).fill(null);
  editingTeamId = (params && params.id) ? params.id : null;

  try {
    const regsData = await api.get('/regulations');
    regulations = regsData.regulations;
    metaConstants = await api.get('/regulations/meta/constants');
    await warmItemTranslations(metaConstants.items || []);
    await warmTypeTranslations((metaConstants.teraTypes || []).map(t => t.name));
    await warmNatureTranslations();

    let existingTeam = null;
    if (editingTeamId) {
      existingTeam = await api.get(`/teams/${editingTeamId}`);
      const currentUser = auth.getUser();
      if (!currentUser || existingTeam.userId !== currentUser.id) {
        toast.show('No tienes permiso para editar este equipo.', 'error');
        navigateTo(`/team/${editingTeamId}`);
        return;
      }
      selectedRegSetId = existingTeam.regSetId;
    }

    const regSelect = document.getElementById('team-regset');
    if (regSelect) {
      regSelect.innerHTML = regulations.map(r => `<option value="${r.id}" ${r.id === selectedRegSetId ? 'selected' : ''}>${r.name}</option>`).join('');
      updateRegsetIncompleteBanner();

      regSelect.addEventListener('change', function() {
        selectedRegSetId = this.value;
        teamSlots = Array(6).fill(null);
        renderSlots();
        updateRegsetIncompleteBanner();
        toast.show('Se ha actualizado el Regulation Set. Los Pokémon agregados se han reiniciado.', 'info');
      });
    }

    const tagsContainer = document.getElementById('tags-checkboxes');
    if (tagsContainer) {
      tagsContainer.innerHTML = (metaConstants.tags || []).map(tag => `
        <label class="tag-badge" style="cursor: pointer; display: flex; align-items: center; gap: 4px; user-select: none;">
          <input type="checkbox" name="team-tags" value="${tag.label}" style="margin: 0;">
          <span>${tag.icon} ${tag.label}</span>
        </label>
      `).join('');
    }

    if (existingTeam) {
      document.getElementById('team-name').value = existingTeam.name || '';
      document.getElementById('team-format').value = existingTeam.format || 'Ranked';
      document.getElementById('team-desc').value = existingTeam.description || '';
      (existingTeam.tags || []).forEach(tag => {
        const checkbox = document.querySelector(`input[name="team-tags"][value="${CSS.escape(tag)}"]`);
        if (checkbox) checkbox.checked = true;
      });

      toast.show('Cargando datos del equipo...', 'info');
      const loadedSlots = await Promise.all(
        (existingTeam.pokemon || []).sort((a, b) => a.slot - b.slot).map(p => loadSlotFromStoredPokemon(p))
      );
      teamSlots = loadedSlots;
    }

    renderSlots();

    const searchInput = document.getElementById('modal-poke-search');
    const suggestionsContainer = document.getElementById('modal-poke-suggestions');
    if (searchInput && suggestionsContainer) {
      setupAutocomplete(searchInput, suggestionsContainer, 
        async (query) => {
          const regPath = `/regulations/${selectedRegSetId}`;
          const currentReg = await api.get(regPath);
          return currentReg.pokemon.filter(p => 
            p.name.toLowerCase().includes(query)
          );
        }, 
        async (selectedPoke) => {
          await selectPokemonForSlot(activeModalSlot, selectedPoke);
        }
      );
    }

    const publishBtn = document.getElementById('publish-team-btn');
    if (publishBtn) {
      publishBtn.addEventListener('click', publishTeam);
    }

    syncMoveLanguageToggle();
  } catch (err) {
    console.error('Error al inicializar team builder:', err);
    toast.show('Error al cargar datos del constructor.', 'error');
  }
};

function updateRegsetIncompleteBanner() {
  const banner = document.getElementById('regset-incomplete-banner');
  if (!banner) return;
  const currentReg = regulations.find(r => r.id === selectedRegSetId);
  banner.style.display = currentReg && currentReg.dataIncomplete ? 'block' : 'none';
}

function renderSlots() {
  const container = document.getElementById('builder-pokemon-slots');
  if (!container) return;

  container.innerHTML = teamSlots.map((p, idx) => {
    return renderPokemonSlot(idx + 1, p, [], metaConstants);
  }).join('');

  teamSlots.forEach((p, idx) => {
    if (p) {
      initSlotAutocompletes(idx + 1, p, metaConstants);
    }
  });
}

// Reconstruye un slot del constructor a partir de un Pokémon ya guardado en un
// equipo (modo edición): re-consulta PokéAPI para el movepool/habilidades
// disponibles y aplica encima los valores ya elegidos por el usuario (ability,
// item, teraType, moves, evs, nature, isShiny).
async function loadSlotFromStoredPokemon(stored) {
  try {
    const pokeData = await pokeapi.get(`/pokemon/${stored.species}`);
    const abilities = pokeData.abilities.map(a => a.ability.name);
    const moves = pokeData.moves.map(m => m.move.name).sort();
    const types = pokeData.types.map(t => t.type.name);
    const baseStats = Array.isArray(pokeData.stats)
      ? Object.fromEntries(pokeData.stats.map(stat => [stat.stat.name, stat.base_stat]))
      : (stored.baseStats || {});

    await warmMoveTranslations(moves);
    await warmAbilityTranslations(abilities);
    await warmTypeTranslations(types);

    const paddedMoves = [0, 1, 2, 3].map(i => (stored.moves && stored.moves[i]) || '');

    return {
      pokeapiId: stored.pokeapiId,
      species: stored.species,
      types,
      availableAbilities: abilities,
      availableMoves: moves,
      baseStats,
      evs: stored.evs || { hp: 0, attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0 },
      ability: stored.ability,
      item: stored.item === 'Ninguno' ? '' : stored.item,
      nature: stored.nature || 'hardy',
      teraType: stored.teraType,
      moves: paddedMoves,
      isShiny: !!stored.isShiny
    };
  } catch (err) {
    console.error(`Error al recargar ${stored.species} para edición:`, err);
    toast.show(`No se pudo recargar ${stored.species.toUpperCase()} desde PokéAPI.`, 'error');
    return null;
  }
}

async function selectPokemonForSlot(slotIdx, pokeMeta) {
  const slotIndex = slotIdx - 1;
  window.builderPage.closePickPokemonModal();

  toast.show(`Cargando movepool y habilidades de ${pokeMeta.name.toUpperCase()}...`, 'info');

  try {
    const pokeData = await pokeapi.get(`/pokemon/${pokeMeta.name}`);
    const abilities = pokeData.abilities.map(a => a.ability.name);
    const moves = pokeData.moves.map(m => m.move.name).sort();
    const types = pokeData.types.map(t => t.type.name);
    const baseStats = Array.isArray(pokeData.stats)
      ? Object.fromEntries(pokeData.stats.map(stat => [stat.stat.name, stat.base_stat]))
      : (pokeData.baseStats || {});
    await warmMoveTranslations(moves);
    await warmAbilityTranslations(abilities);
    await warmTypeTranslations(types);
    await warmNatureTranslations();

    // Al seleccionar una Mega, auto-equipar su Megapiedra si el usuario lo desea para mejorar UX
    const speciesLower = pokeMeta.name.toLowerCase().trim();
    const megaRule = megaBaseIds[speciesLower];
    const defaultItem = megaRule ? megaRule.stone : '';

    teamSlots[slotIndex] = {
      pokeapiId: pokeMeta.pokeapiId,
      species: pokeMeta.name,
      types: types,
      availableAbilities: abilities,
      availableMoves: moves,
      baseStats,
      evs: {
        hp: 0,
        attack: 0,
        defense: 0,
        'special-attack': 0,
        'special-defense': 0,
        speed: 0
      },
      ability: abilities[0] || '',
      item: defaultItem,
      nature: 'hardy',
      teraType: types[0] ? types[0].charAt(0).toUpperCase() + types[0].slice(1) : 'Normal',
      moves: ['', '', '', ''],
      isShiny: false
    };

    renderSlots();
    toast.show(`${pokeMeta.name.toUpperCase()} añadido al slot ${slotIdx}.`, 'success');
    if (defaultItem) {
      toast.show(`Se equipó automáticamente: ${defaultItem} (Megapiedra obligatoria).`, 'info');
    }
  } catch (err) {
    console.error(err);
    toast.show('Error al traer detalles del Pokémon desde PokéAPI.', 'error');
  }
}

async function publishTeam() {
  const nameInput = document.getElementById('team-name');
  const regSelect = document.getElementById('team-regset');
  const formatSelect = document.getElementById('team-format');
  const descText = document.getElementById('team-desc');
  const publishBtn = document.getElementById('publish-team-btn');

  if (!nameInput.value.trim()) {
    toast.show('Debes ingresar un nombre para el equipo.', 'error');
    nameInput.focus();
    return;
  }

  const filledSlots = teamSlots.filter(s => s !== null);
  if (filledSlots.length !== 6) {
    toast.show('Debes configurar los 6 Pokémon del equipo para poder publicar.', 'error');
    return;
  }

  const checkedTags = Array.from(document.querySelectorAll('input[name="team-tags"]:checked'))
    .map(cb => cb.value);

  const speciesList = [];
  const itemsList = [];

  for (let i = 0; i < filledSlots.length; i++) {
    const p = filledSlots[i];
    const speciesLower = p.species.toLowerCase().trim();
    
    if (!p.ability) {
      toast.show(`El Pokémon ${p.species.toUpperCase()} en slot ${i+1} no tiene habilidad seleccionada.`, 'error');
      return;
    }
    
    const validMoves = p.moves.filter(m => m && m.trim() !== '');
    if (validMoves.length === 0) {
      toast.show(`El Pokémon ${p.species.toUpperCase()} en slot ${i+1} debe tener al menos 1 movimiento configurado.`, 'error');
      return;
    }

    // REGLA DE NEGOCIO: Validar Megapiedra obligatoria en el Frontend
    const megaRule = megaBaseIds[speciesLower];
    if (megaRule) {
      const equippedItem = (p.item || '').trim().toLowerCase();
      const requiredStone = megaRule.stone.toLowerCase();
      if (equippedItem !== requiredStone) {
        toast.show(`El Pokémon ${p.species.toUpperCase()} requiere tener equipada su megapiedra específica: ${megaRule.stone}.`, 'error');
        const itemInput = document.getElementById(`item-input-${i+1}`);
        if (itemInput) itemInput.focus();
        return;
      }
    }

    if (speciesList.includes(p.species)) {
      toast.show(`No puedes incluir dos Pokémon de la especie ${p.species.toUpperCase()} (Species Clause).`, 'error');
      return;
    }
    speciesList.push(p.species);

    if (p.item && p.item.trim() !== '') {
      const cleanItem = p.item.toLowerCase().trim();
      if (itemsList.includes(cleanItem)) {
        toast.show(`No puedes duplicar el objeto ${p.item.toUpperCase()} en tu equipo (Item Clause).`, 'error');
        return;
      }
      itemsList.push(cleanItem);
    }
  }

  const teamPayload = {
    name: nameInput.value.trim(),
    regSetId: regSelect.value,
    format: formatSelect.value,
    description: descText.value.trim(),
    tags: checkedTags,
    pokemon: filledSlots.map(p => ({
      pokeapiId: p.pokeapiId,
      species: p.species,
      types: p.types,
      ability: p.ability,
      item: p.item,
      teraType: p.teraType,
      moves: p.moves.filter(m => m && m.trim() !== ''),
      isShiny: p.isShiny,
      baseStats: p.baseStats,
      evs: p.evs,
      nature: p.nature
    }))
  };

  try {
    publishBtn.disabled = true;
    publishBtn.textContent = editingTeamId ? 'Guardando...' : 'Publicando...';

    if (editingTeamId) {
      await api.put(`/teams/${editingTeamId}`, teamPayload);
      toast.show('¡Equipo actualizado exitosamente!', 'success');
      navigateTo(`/team/${editingTeamId}`);
    } else {
      const res = await api.post('/teams', teamPayload);
      toast.show('¡Equipo publicado exitosamente!', 'success');
      navigateTo(`/team/${res.id}`);
    }
  } catch (err) {
    toast.show(err.message || 'Error al guardar el equipo.', 'error');
    publishBtn.disabled = false;
    publishBtn.textContent = editingTeamId ? 'Guardar Cambios' : 'Publicar Equipo';
  }
}

window.builderPage = {
  openPickPokemonModal(slotIdx) {
    activeModalSlot = slotIdx;
    document.getElementById('modal-slot-title').textContent = slotIdx;
    
    const searchInput = document.getElementById('modal-poke-search');
    searchInput.value = '';

    const modal = document.getElementById('add-pokemon-modal');
    modal.classList.add('active');
    
    setTimeout(() => searchInput.focus(), 150);
  },

  closePickPokemonModal() {
    const modal = document.getElementById('add-pokemon-modal');
    if (modal) modal.classList.remove('active');
    activeModalSlot = null;
  },

  removePokemon(slotIdx) {
    teamSlots[slotIdx - 1] = null;
    renderSlots();
  },

  updatePokemonField(slotIdx, field, value) {
    if (teamSlots[slotIdx - 1]) {
      teamSlots[slotIdx - 1][field] = value;
      if (field === 'nature') {
        renderSlots();
      }
    }
  },

  updatePokemonEV(slotIdx, statKey, value) {
    const slot = teamSlots[slotIdx - 1];
    if (!slot) return;

    if (!slot.evs || typeof slot.evs !== 'object') {
      slot.evs = {};
    }

    const cleanedValue = Number.parseInt(value, 10);
    const newEVValue = Number.isFinite(cleanedValue) ? Math.max(0, Math.min(32, cleanedValue)) : 0;

    // Calcular total de EVs antes de actualizar
    const statKeys = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
    const currentTotal = statKeys.reduce((sum, key) => {
      const val = key === statKey ? newEVValue : (Number(slot.evs[key]) || 0);
      return sum + val;
    }, 0);

    // Si el total excedería 66, rechazar la actualización
    if (currentTotal > 66) {
      toast.show('El máximo de EVs totales por Pokémon es 66.', 'warning');
      return;
    }

    slot.evs[statKey] = newEVValue;
    renderSlots();
  },

  updatePokemonMove(slotIdx, moveIdx, moveName) {
    if (teamSlots[slotIdx - 1]) {
      teamSlots[slotIdx - 1].moves[moveIdx] = canonicalizeMoveName(moveName);
    }
  },

  toggleMoveLanguage() {
    const nextLanguage = getMoveLanguage() === 'es' ? 'en' : 'es';
    setMoveLanguage(nextLanguage);
    syncMoveLanguageToggle();
    renderSlots();
  },

  toggleShiny(slotIdx, isChecked) {
    const slotIndex = slotIdx - 1;
    if (teamSlots[slotIndex]) {
      teamSlots[slotIndex].isShiny = isChecked;
      
      const spriteImg = document.getElementById(`slot-sprite-${slotIdx}`);
      if (spriteImg) {
        spriteImg.style.opacity = '0.3';
        spriteImg.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
          const speciesLower = teamSlots[slotIndex].species.toLowerCase().trim();
          let cleanId = teamSlots[slotIndex].pokeapiId;
          
          // Mapear al ID base para evitar imágenes rotas al alternar el shiny
          const rule = megaBaseIds[speciesLower];
          if (rule) {
            cleanId = rule.id;
          }
          
          spriteImg.src = isChecked
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${cleanId}.png`
            : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${cleanId}.png`;
          
          spriteImg.style.opacity = '1';
          spriteImg.style.transform = 'scale(1)';
        }, 150);
      }
    }
  }
};

function syncMoveLanguageToggle() {
  const button = document.getElementById('move-language-toggle');
  if (!button) return;

  const language = getMoveLanguage();
  button.textContent = language === 'es' ? 'ES / EN' : 'EN / ES';
  button.title = language === 'es' ? 'Cambiar a mostrar inglés primero' : 'Cambiar a mostrar español primero';
}

export default teamBuilderPage;
