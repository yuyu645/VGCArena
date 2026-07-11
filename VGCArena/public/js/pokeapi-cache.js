const DB_NAME = 'vgc-arena-pokeapi';
const DB_VERSION = 1;
const STORE_NAME = 'pokemon-cache';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 días

let customPokemonDB = null;

const CUSTOM_BASE_SPECIES_IDS = {
  'raichu-alola': 26,
  'ninetales-alola': 38,
  'arcanine-hisuian': 59,
  'slowbro-galarian': 80,
  'tauros-paldean-combat': 128,
  'tauros-paldean-blaze': 128,
  'tauros-paldean-aqua': 128,
  'typhlosion-hisuian': 157,
  'slowking-galarian': 199,
  'samurott-hisuian': 503,
  'zoroark-hisuian': 571,
  'stunfisk-galarian': 618,
  'floette-eternal': 670,
  'meowstic-female': 678,
  'goodra-hisuian': 706,
  'avalugg-hisuian': 713,
  'decidueye-hisuian': 724,
  'basculegion-female': 902,
  'mega-venusaur': 3,
  'mega-charizard-x': 6,
  'mega-charizard-y': 6,
  'mega-blastoise': 9,
  'mega-raichu-x': 26,
  'mega-raichu-y': 26,
  'mega-metagross': 376,
  'mega-sceptile': 254,
  'mega-blaziken': 257,
  'mega-swampert': 260,
  'mega-mawile': 303,
  'mega-staraptor': 398,
  'mega-scolipede': 545,
  'mega-scrafty': 560,
  'mega-eelektross': 604,
  'mega-pyroar': 668,
  'mega-malamar': 687,
  'mega-barbaracle': 689,
  'mega-dragalge': 691,
  'mega-falinks': 870
};

async function loadCustomPokemonDB() {
  if (customPokemonDB) return customPokemonDB;
  try {
    const res = await fetch('/data/pokemon-custom-db.json');
    if (res.ok) {
      customPokemonDB = await res.json();
    }
  } catch (err) {
    console.error('Error al cargar la base de datos de Pokémon personalizados:', err);
  }
  return customPokemonDB || {};
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'endpoint' });
      }
    };
  });
}

const memoryCache = new Map();

const pokeapi = {
  async get(endpoint) {
    const cleanEndpoint = endpoint.replace(/^\/|\/$/g, '');
    const parts = cleanEndpoint.split('/');
    
    // Interceptar si es una petición a un Pokémon individual
    if (parts[0] === 'pokemon' && parts[1]) {
      const identifier = parts[1].toLowerCase();
      const customDB = await loadCustomPokemonDB();

      // Buscar si es un Pokémon customizado (Mega de Legends Z-A)
      let customPoke = customDB[identifier];
      if (!customPoke) {
        // También buscar por ID
        const idNum = Number(identifier);
        if (!isNaN(idNum) && idNum >= 20000) {
          customPoke = Object.values(customDB).find(p => p.pokeapiId === idNum);
        }
      }

      if (customPoke) {
        console.log(`[Caché VGC] Retornando Pokémon personalizado: ${customPoke.name}`);
        const baseSpeciesId = CUSTOM_BASE_SPECIES_IDS[customPoke.name];
        const basePokemon = baseSpeciesId ? await this.get(`/pokemon/${baseSpeciesId}`) : null;
        // Mapear al formato esperado de respuesta de PokéAPI
        return {
          id: customPoke.pokeapiId,
          name: customPoke.name,
          stats: Array.isArray(basePokemon && basePokemon.stats)
            ? basePokemon.stats.map(stat => ({
                base_stat: stat.base_stat,
                effort: stat.effort,
                stat: { name: stat.stat.name, url: stat.stat.url }
              }))
            : [],
          baseStats: Array.isArray(basePokemon && basePokemon.stats)
            ? Object.fromEntries(basePokemon.stats.map(stat => [stat.stat.name, stat.base_stat]))
            : {},
          abilities: customPoke.abilities.map((a, i) => ({
            ability: { name: a, url: '' },
            is_hidden: false,
            slot: i + 1
          })),
          moves: customPoke.moves.map(m => ({
            move: { name: m, url: '' }
          })),
          types: customPoke.types.map((t, i) => ({
            type: { name: t.toLowerCase() },
            slot: i + 1
          })),
          sprites: {
            front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${customPoke.pokeapiId}.png`,
            front_shiny: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${customPoke.pokeapiId}.png`,
            other: {
              'official-artwork': {
                front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${customPoke.pokeapiId}.png`,
                front_shiny: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${customPoke.pokeapiId}.png`
              }
            }
          }
        };
      }
    }

    // 1. Capa de Memoria
    if (memoryCache.has(cleanEndpoint)) {
      return memoryCache.get(cleanEndpoint);
    }

    // 2. Capa de IndexedDB
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const cached = await new Promise((resolve) => {
        const req = store.get(cleanEndpoint);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });

      if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        memoryCache.set(cleanEndpoint, cached.data);
        return cached.data;
      }
    } catch (e) {
      console.warn('IndexedDB no disponible, cargando directo de API:', e);
    }

    // 3. Petición directa a PokéAPI (con fallback a la versión base si falla la Mega clásica)
    try {
      const url = `https://pokeapi.co/api/v2/${cleanEndpoint}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        // Si falla por ejemplo al buscar un "mega-charizard-x" directamente (porque a veces se manejan de otras formas en PokéAPI)
        // Intentar obtener el Pokémon base
        if (cleanEndpoint.includes('mega-') || cleanEndpoint.includes('-mega')) {
          let baseName = cleanEndpoint.replace('pokemon/mega-', '').replace('pokemon/', '').split('-')[0];
          console.log(`Petición de Mega fallida. Intentando obtener datos del Pokémon base: ${baseName}`);
          const baseData = await this.get(`pokemon/${baseName}`);
          
          // Clonar datos base y retornar como la forma Mega
          return {
            ...baseData,
            name: cleanEndpoint.split('/').pop(),
            sprites: {
              ...baseData.sprites,
              // Mapear sprites genéricos si se desea o usar del base
            }
          };
        }
        throw new Error(`Error de PokéAPI: ${response.status}`);
      }
      
      const data = await response.json();
      memoryCache.set(cleanEndpoint, data);

      openDB().then(db => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.put({
          endpoint: cleanEndpoint,
          data,
          timestamp: Date.now()
        });
      }).catch(err => console.error('Error al guardar en IndexedDB:', err));

      return data;
    } catch (error) {
      console.error(`Error al obtener datos de PokéAPI en el endpoint [${cleanEndpoint}]:`, error);
      throw error;
    }
  }
};

export default pokeapi;
