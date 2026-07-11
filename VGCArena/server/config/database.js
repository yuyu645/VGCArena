const fs = require('fs');
const path = require('path');

// En producción con DATABASE_URL configurada usamos Postgres (persistencia real
// en un host gratuito sin disco propio, p. ej. Render free + Neon/Supabase).
// Sin DATABASE_URL, seguimos usando el archivo JSON plano para desarrollo local.
// Ambos backends exponen la misma interfaz async: find/findOne/insert/update/delete.
const USE_POSTGRES = !!process.env.DATABASE_URL;

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function matchesQuery(row, query) {
  for (const key in query) {
    if (Array.isArray(query[key])) {
      if (!query[key].includes(row[key])) return false;
    } else if (row[key] !== query[key]) {
      return false;
    }
  }
  return true;
}

let backend;

if (USE_POSTGRES) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const ready = pool.query(`
    CREATE TABLE IF NOT EXISTS records (
      table_name TEXT NOT NULL,
      id TEXT NOT NULL,
      data JSONB NOT NULL,
      PRIMARY KEY (table_name, id)
    )
  `).catch(err => console.error('Error al inicializar tabla Postgres:', err));

  backend = {
    async find(table, query = {}) {
      await ready;
      const { rows } = await pool.query('SELECT data FROM records WHERE table_name = $1', [table]);
      return rows.map(r => r.data).filter(row => matchesQuery(row, query));
    },

    async findOne(table, query = {}) {
      const results = await this.find(table, query);
      return results.length > 0 ? results[0] : null;
    },

    async insert(table, row) {
      await ready;
      const newRow = { id: genId(), ...row, createdAt: new Date().toISOString() };
      await pool.query(
        'INSERT INTO records (table_name, id, data) VALUES ($1, $2, $3)',
        [table, newRow.id, JSON.stringify(newRow)]
      );
      return newRow;
    },

    async update(table, query, updateData) {
      const matches = await this.find(table, query);
      let updatedCount = 0;
      for (const row of matches) {
        const newRow = { ...row, ...updateData, updatedAt: new Date().toISOString() };
        await pool.query(
          'UPDATE records SET data = $1 WHERE table_name = $2 AND id = $3',
          [JSON.stringify(newRow), table, row.id]
        );
        updatedCount++;
      }
      return updatedCount;
    },

    async delete(table, query) {
      const matches = await this.find(table, query);
      for (const row of matches) {
        await pool.query('DELETE FROM records WHERE table_name = $1 AND id = $2', [table, row.id]);
      }
      return matches.length;
    }
  };
} else {
  // En producción con disco persistente (p. ej. Render con disco), DB_FILE debe
  // apuntar a una ruta fuera del repo para no perder los datos en cada redeploy
  // ni pisar los JSON estáticos versionados en /data.
  const DB_FILE = process.env.DB_FILE
    ? path.resolve(process.env.DB_FILE)
    : path.join(__dirname, '../../data/db.json');

  const EMPTY_DB = { users: [], teams: [], team_pokemon: [], ratings: [], comments: [], reports: [], favorites: [] };

  function initDB() {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(EMPTY_DB, null, 2), 'utf-8');
    }
  }

  initDB();

  function load() {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Error al cargar la base de datos JSON:', e);
      return { ...EMPTY_DB };
    }
  }

  // Guarda todo el JSON de forma atómica: escribe a un temporal y luego
  // renombra. Un corte a mitad de escritura deja el .tmp a medias pero nunca
  // corrompe el archivo real (rename es atómico en el mismo sistema de ficheros).
  function save(data) {
    try {
      const tmp = DB_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmp, DB_FILE);
    } catch (e) {
      console.error('Error al guardar la base de datos JSON:', e);
    }
  }

  backend = {
    async find(table, query = {}) {
      const data = load();
      const rows = data[table] || [];
      return rows.filter(row => matchesQuery(row, query));
    },

    async findOne(table, query = {}) {
      const results = await this.find(table, query);
      return results.length > 0 ? results[0] : null;
    },

    async insert(table, row) {
      const data = load();
      if (!data[table]) data[table] = [];
      const newRow = { id: genId(), ...row, createdAt: new Date().toISOString() };
      data[table].push(newRow);
      save(data);
      return newRow;
    },

    async update(table, query, updateData) {
      const data = load();
      const rows = data[table] || [];
      let updatedCount = 0;

      const newRows = rows.map(row => {
        if (!matchesQuery(row, query)) return row;
        updatedCount++;
        return { ...row, ...updateData, updatedAt: new Date().toISOString() };
      });

      data[table] = newRows;
      save(data);
      return updatedCount;
    },

    async delete(table, query) {
      const data = load();
      const rows = data[table] || [];
      const initialLength = rows.length;

      data[table] = rows.filter(row => !matchesQuery(row, query));
      save(data);
      return initialLength - data[table].length;
    }
  };
}

module.exports = backend;
