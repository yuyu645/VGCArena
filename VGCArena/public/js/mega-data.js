// Diccionario compartido de Megaevoluciones: id de PokéAPI del Pokémon base y
// nombre de la megapiedra requerida. Única fuente de verdad para evitar que
// team-builder.js, team-detail.js, pokemon-slot.js y team-card.js diverjan.
export const megaBaseIds = {
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
  "mega-garchomp-z": { id: 445, stone: "Garchompite" },
  "mega-malamar": { id: 687, stone: "Malamarite" },
  "mega-barbaracle": { id: 689, stone: "Barbaracite" },
  "mega-dragalge": { id: 691, stone: "Dragalgenite" },
  "mega-falinks": { id: 870, stone: "Falinksite" }
};

// Mapea especies mega a la URL de sprite de su forma base (evita imágenes rotas,
// ya que PokéAPI/el repo de sprites no tiene entradas propias para las megas).
export function getSpriteUrl(pokeapiId, speciesName, isShiny) {
  let id = pokeapiId;
  const species = (speciesName || '').toLowerCase().trim();

  if (megaBaseIds[species]) {
    id = megaBaseIds[species].id;
  }

  return isShiny
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}
