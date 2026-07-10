import api from '../api.js';
import pokeapi from '../pokeapi-cache.js';
import { renderPokemonSlot, initSlotAutocompletes } from '../components/pokemon-slot.js';
import { setupAutocomplete } from '../components/autocomplete.js';
import toast from '../components/toast.js';
import { navigateTo } from '../app.js';

let regulations = [];
let metaConstants = {};
let selectedRegSetId = 'reg-h';
let teamSlots = Array(6).fill(null);
let activeModalSlot = null;

// Diccionario de Megapiedras para validación en caliente en el cliente
const megaBaseIds = {
  "mega-venusaur": { id: 3, stone: "Venusaurite" },
  "mega-charizard-x": { id: 6, stone: "Charizardite X" },
  "mega-charizard-y": { id: 6, stone: "Charizardite Y" },
  "mega-blastoise": { id: 9, stone: "Blastoisinite" },
  "mega-beedrill": { id: 15, stone: "Beedrillite" },
  "mega-pidgeot": { id: 18, stone: "Pidgeotite" },
  "mega-alakazam": { id: 65, stone: "Alakazite" },
  "mega-slowbro": { id: 80, stone: "Slowbronite" },
  "mega-gengar": { id: 94, stone: "Gengarite" },
  "mega-kangaskhan": { id: 115, stone: "Kangaskhanite" },
  "mega-pinsir": { id: 127, stone: "Pinsirite" },
  "mega-gyarados": { id: 130, stone: "Gyaradosite" },
  "mega-aerodactyl": { id: 142, stone: "Aerodactylite" },
  "mega-ampharos": { id: 181, stone: "Ampharosite" },
  "mega-scizor": { id: 212, stone: "Scizorite" },
  "mega-heracross": { id: 214, stone: "Heracronite" },
  "mega-houndoom": { id: 229, stone: "Houndoominite" },
  "mega-tyranitar": { id: 248, stone: "Tyranitarite" },
  "mega-blaziken": { id: 257, stone: "Blazikenite" },
  "mega-gardevoir": { id: 282, stone: "Gardevoirite" },
  "mega-mawile": { id: 303, stone: "Mawilite" },
  "mega-aggron": { id: 306, stone: "Aggronite" },
  "mega-medicham": { id: 308, stone: "Medichamite" },
  "mega-manectric": { id: 310, stone: "Manectricite" },
  "mega-sharpedo": { id: 319, stone: "Sharpedonite" },
  "mega-camerupt": { id: 323, stone: "Cameruptite" },
  "mega-altaria": { id: 334, stone: "Altarianite" },
  "mega-banette": { id: 354, stone: "Banettite" },
  "mega-absol": { id: 359, stone: "Absolite" },
  "mega-glalie": { id: 362, stone: "Glalitite" },
  "mega-metagross": { id: 376, stone: "Metagrossite" },
  "mega-lopunny": { id: 428, stone: "Lopunnite" },
  "mega-garchomp": { id: 445, stone: "Garchompite" },
  "mega-lucario": { id: 448, stone: "Lucarionite" },
  "mega-abomasnow": { id: 460, stone: "Abomasnowite" },
  "mega-steelix": { id: 208, stone: "Steelixite" },
  "mega-sceptile": { id: 254, stone: "Sceptilite" },
  "mega-swampert": { id: 260, stone: "Swampertite" },
  "mega-sableye": { id: 302, stone: "Sablenite" },
  "mega-meganium": { id: 154, stone: "Meganiumite" },
  "mega-excadrill": { id: 530, stone: "Excadrillite" },
  "mega-greninja": { id: 658, stone: "Greninjite" },
  "mega-skarmory": { id: 227, stone: "Skarmoryite" },
  "mega-chimecho": { id: 358, stone: "Chimechite" },
  "mega-chandelure": { id: 609, stone: "Chandelurite" },
  "mega-golurk": { id: 623, stone: "Golurkite" },
  "mega-victreebel": { id: 71, stone: "Victreebelite" },
  "mega-starmie": { id: 121, stone: "Starmite" },
  "mega-raichu-x": { id: 26, stone: "Raichuite X" },
  "mega-raichu-y": { id: 26, stone: "Raichuite Y" },
  "mega-staraptor": { id: 398, stone: "Staraptorite" },
  "mega-scolipede": { id: 545, stone: "Scolipedite" },
  "mega-scrafty": { id: 560, stone: "Scraftyite" },
  "mega-drampa": { id: 780, stone: "Drampatite" },
  "mega-froslass": { id: 478, stone: "Froslassite" },
  "mega-emboar": { id: 500, stone: "Emboarite" },
  "mega-chesnaught": { id: 652, stone: "Chesnaughtite" },
  "mega-delphox": { id: 655, stone: "Delphoxite" },
  "mega-dragonite": { id: 149, stone: "Dragonitite" },
  "mega-eelektross": { id: 604, stone: "Eelektrossite" },
  "mega-pyroar": { id: 668, stone: "Pyroarite" },
  "mega-eternal-floette": { id: 670, stone: "Floettite" },
  "mega-garchomp-z": { id: 445, stone: "Garchompite" }
};

async function teamBuilderPage() {
  return `
    <div>
      <div style="margin-bottom: var(--space-5);">
        <h1 style="font-size: 1.85rem;"><span class="text-gradient">Constructor de Equipos</span></h1>
        <p style="color: var(--text-secondary); font-size: 0.95rem; margin-top: 4px;">Crea tu alineación competitiva de 6 Pokémon legales según la regulación oficial de Ranked.</p>
      </div>

      <form id="builder-form" onsubmit="event.preventDefault();">
        <div class="card" style="margin-bottom: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4);">
          <h3 style="font-size: 1.2rem; border-left: 4px solid var(--accent-primary); padding-left: var(--space-2);">1. Información General</h3>
          
          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: var(--space-4);">
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
          <h3 style="font-size: 1.2rem; margin-bottom: var(--space-4); border-left: 4px solid var(--accent-primary); padding-left: var(--space-2);">2. Miembros del Equipo (6 Pokémon)</h3>
          
          <div class="builder-grid" id="builder-pokemon-slots">
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-6);">
          <a href="/" data-link class="btn btn-secondary">Cancelar</a>
          <button id="publish-team-btn" class="btn btn-primary" style="font-size: 1.05rem;">Publicar Equipo</button>
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

teamBuilderPage.init = async function() {
  teamSlots = Array(6).fill(null);

  try {
    const regsData = await api.get('/regulations');
    regulations = regsData.regulations;
    metaConstants = await api.get('/regulations/meta/constants');

    const regSelect = document.getElementById('team-regset');
    if (regSelect) {
      regSelect.innerHTML = regulations.map(r => `<option value="${r.id}" ${r.id === selectedRegSetId ? 'selected' : ''}>${r.name}</option>`).join('');
      
      regSelect.addEventListener('change', function() {
        selectedRegSetId = this.value;
        teamSlots = Array(6).fill(null);
        renderSlots();
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
  } catch (err) {
    console.error('Error al inicializar team builder:', err);
    toast.show('Error al cargar datos del constructor.', 'error');
  }
};

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

async function selectPokemonForSlot(slotIdx, pokeMeta) {
  const slotIndex = slotIdx - 1;
  window.builderPage.closePickPokemonModal();

  toast.show(`Cargando movepool y habilidades de ${pokeMeta.name.toUpperCase()}...`, 'info');

  try {
    const pokeData = await pokeapi.get(`/pokemon/${pokeMeta.pokeapiId}`);
    const abilities = pokeData.abilities.map(a => a.ability.name);
    const moves = pokeData.moves.map(m => m.move.name).sort();
    const types = pokeData.types.map(t => t.type.name);

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
      ability: abilities[0] || '',
      item: defaultItem,
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
      ability: p.ability,
      item: p.item,
      teraType: p.teraType,
      moves: p.moves.filter(m => m && m.trim() !== ''),
      isShiny: p.isShiny
    }))
  };

  try {
    publishBtn.disabled = true;
    publishBtn.textContent = 'Publicando...';

    const res = await api.post('/teams', teamPayload);
    toast.show('¡Equipo publicado exitosamente!', 'success');
    navigateTo(`/team/${res.id}`);
  } catch (err) {
    toast.show(err.message || 'Error al publicar el equipo.', 'error');
    publishBtn.disabled = false;
    publishBtn.textContent = 'Publicar Equipo';
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
    }
  },

  updatePokemonMove(slotIdx, moveIdx, moveName) {
    if (teamSlots[slotIdx - 1]) {
      teamSlots[slotIdx - 1].moves[moveIdx] = moveName;
    }
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

export default teamBuilderPage;
