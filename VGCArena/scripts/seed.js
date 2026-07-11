const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, '../data/db.json');

function runSeeder() {
  console.log('Iniciando poblamiento de la base de datos JSON (Seed V2 con Staff)...');

  const salt = bcrypt.genSaltSync(10);
  const pass1 = bcrypt.hashSync('Trainer123', salt);
  const pass2 = bcrypt.hashSync('Cynthia123', salt);
  const pass3 = bcrypt.hashSync('Steven123', salt);
  const passStaff = bcrypt.hashSync('StaffPass123!', salt);

  // 1. Usuarios demo con roles
  const users = [
    {
      id: "u1",
      username: "RedVGC",
      email: "red@vgc.com",
      passwordHash: pass1,
      role: "user",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=RedVGC",
      bio: "Entrenador competitivo de Kanto. Especialista en arquetipos de clima de sol (Sun Teams).",
      reputation: 60,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "u2",
      username: "CynthiaChampion",
      email: "cynthia@vgc.com",
      passwordHash: pass2,
      role: "user",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Cynthia",
      bio: "Campeona de Sinnoh. Jugadora habitual de Open Team Sheets en torneos regionales de eSports.",
      reputation: 85,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "u3",
      username: "StevenStone",
      email: "steven@vgc.com",
      passwordHash: pass3,
      role: "user",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Steven",
      bio: "Entrenador de Hoenn. Especialista en tipos acero, arena y composiciones balanceadas con bulky offense.",
      reputation: 40,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "u_staff",
      username: "StaffVGC",
      email: "staff@vgc.com",
      passwordHash: passStaff,
      role: "staff",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=StaffVGC",
      bio: "Cuenta de moderación oficial de VGC Arena. Reportar problemas directos aquí.",
      reputation: 0,
      createdAt: new Date().toISOString()
    }
  ];

  // 2. Equipos demo (incluyendo Pokémon especiales y Megas)
  const teams = [
    {
      id: "t1",
      userId: "u1",
      name: "Sunny Day Mega-Charizard Team",
      regSetId: "reg-h",
      format: "Ranked",
      description: "Composición de sol construida alrededor de Mega Charizard Y y Venusaur. Torkoal pone el clima, Charizard arrasa con Onda Ígnea potenciada y Venusaur duplica velocidad con Clorofila.",
      tags: ["Sun Team", "Hyper Offense"],
      avgStrength: 4.5,
      avgOriginality: 3.5,
      totalVotes: 2,
      viewCount: 154,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "t2",
      userId: "u2",
      name: "Legends Z-A: Mega Greninja Core",
      regSetId: "reg-h",
      format: "Torneo",
      description: "Prueba conceptual para la nueva regulación Z-A. Mega Greninja activa Mutatipo para maximizar daño en cobertura elemental, mientras que Amoonguss y Skarmory proveen un core balanceado y defensivo.",
      tags: ["Rain Team", "Balance"],
      avgStrength: 4.9,
      avgOriginality: 4.8,
      totalVotes: 2,
      viewCount: 420,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // 3. Pokémon asociados a los equipos demo
  const team_pokemon = [
    // Pokémon Equipo 1 (Sun Team con Mega Charizard Y)
    { id: "tp1", teamId: "t1", slot: 1, pokeapiId: 324, species: "torkoal", types: ["Fire"], item: "Charcoal", ability: "drought", teraType: "Fire", moves: ["eruption", "heat-wave", "solar-beam", "protect"], isShiny: false },
    { id: "tp2", teamId: "t1", slot: 2, pokeapiId: 3, species: "venusaur", types: ["Grass", "Poison"], item: "Life Orb", ability: "chlorophyll", teraType: "Grass", moves: ["leaf-storm", "sludge-bomb", "earth-power", "protect"], isShiny: true },
    { id: "tp3", teamId: "t1", slot: 3, pokeapiId: 10035, species: "mega-charizard-y", types: ["Fire", "Flying"], item: "Charizardite Y", ability: "drought", teraType: "Fire", moves: ["heat-wave", "air-slash", "solar-beam", "protect"], isShiny: false },
    { id: "tp4", teamId: "t1", slot: 4, pokeapiId: 727, species: "incineroar", types: ["Fire", "Dark"], item: "Safety Goggles", ability: "intimidate", teraType: "Ghost", moves: ["fake-out", "flare-blitz", "parting-shot", "knock-off"], isShiny: false },
    { id: "tp5", teamId: "t1", slot: 5, pokeapiId: 1018, species: "archaludon", types: ["Steel", "Dragon"], item: "Assault Vest", ability: "stamina", teraType: "Steel", moves: ["electro-shot", "flash-cannon", "draco-meteor", "snarl"], isShiny: false },
    { id: "tp6", teamId: "t1", slot: 6, pokeapiId: 10061, species: "floette-eternal", types: ["Fairy"], item: "Choice Specs", ability: "flower-veil", teraType: "Fairy", moves: ["light-of-ruin", "moonblast", "psychic", "dazzling-gleam"], isShiny: false },

    // Pokémon Equipo 2 (Rain Team con Mega Greninja)
    { id: "tp7", teamId: "t2", slot: 1, pokeapiId: 20003, species: "mega-greninja", types: ["Water", "Dark"], item: "Life Orb", ability: "protean", teraType: "Water", moves: ["hydro-pump", "water-shuriken", "dark-pulse", "ice-beam"], isShiny: false },
    { id: "tp8", teamId: "t2", slot: 2, pokeapiId: 279, species: "pelipper", types: ["Water", "Flying"], item: "Focus Sash", ability: "drizzle", teraType: "Water", moves: ["hurricane", "scald", "tailwind", "protect"], isShiny: false },
    { id: "tp9", teamId: "t2", slot: 3, pokeapiId: 20002, species: "mega-excadrill", types: ["Ground", "Steel"], item: "Assault Vest", ability: "piercing-drill", teraType: "Steel", moves: ["earthquake", "iron-head", "rock-slide", "protect"], isShiny: false },
    { id: "tp10", teamId: "t2", slot: 4, pokeapiId: 591, species: "amoonguss", types: ["Grass", "Poison"], item: "Rocky Helmet", ability: "regenerator", teraType: "Grass", moves: ["spore", "rage-powder", "pollen-puff", "protect"], isShiny: true },
    { id: "tp11", teamId: "t2", slot: 5, pokeapiId: 20004, species: "mega-skarmory", types: ["Steel", "Flying"], item: "Leftovers", ability: "stalwart", teraType: "Steel", moves: ["brave-bird", "iron-defense", "body-press", "roost"], isShiny: false },
    { id: "tp12", teamId: "t2", slot: 6, pokeapiId: 887, species: "dragapult", types: ["Dragon", "Ghost"], item: "Choice Band", ability: "clear-body", teraType: "Dragon", moves: ["dragon-darts", "phantom-force", "u-turn", "sucker-punch"], isShiny: false }
  ];

  // 4. Ratings demo
  const ratings = [
    { id: "r1", userId: "u2", teamId: "t1", strength: 4, originality: 3, createdAt: new Date().toISOString() },
    { id: "r2", userId: "u3", teamId: "t1", strength: 5, originality: 4, createdAt: new Date().toISOString() },
    
    { id: "r3", userId: "u1", teamId: "t2", strength: 5, originality: 5, createdAt: new Date().toISOString() },
    { id: "r4", userId: "u3", teamId: "t2", strength: 4, originality: 4, createdAt: new Date().toISOString() }
  ];

  // 5. Comentarios demo
  const comments = [
    {
      id: "c1",
      userId: "u2",
      teamId: "t1",
      parentId: null,
      body: "Me encanta ver a Floette Flor Eterna en este set de sol. Su movimiento exclusivo 'Luz del Ruina' hace un daño impresionante.",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "c2",
      userId: "u1",
      parentId: "c1",
      teamId: "t1",
      body: "¡Exacto! El sol potencia la cobertura y permite a Venusaur y Charizard meter muchísima presión en early game.",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // 6. Reportes iniciales de Staff
  const reports = [
    {
      id: "rep1",
      reporterId: "u3",
      teamId: "t1",
      reason: "La descripción del equipo contiene spam promocional hacia un canal no verificado.",
      status: "pending",
      createdAt: new Date().toISOString()
    }
  ];

  const dbData = {
    users,
    teams,
    team_pokemon,
    ratings,
    comments,
    reports
  };

  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
  console.log('Base de datos JSON repoblada con éxito. Cuentas de usuario normales, de Staff, Pokémon customizados y reportes creados.');
}

runSeeder();
