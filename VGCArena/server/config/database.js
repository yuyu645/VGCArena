const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../../data/db.json');

// Inicializar la base de datos JSON si no existe
function initDB() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [],
      teams: [],
      team_pokemon: [],
      ratings: [],
      comments: [],
      reports: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

initDB();

const db = {
  // Carga todo el JSON
  _load() {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error("Error al cargar la base de datos JSON:", e);
      return {
        users: [],
        teams: [],
        team_pokemon: [],
        ratings: [],
        comments: [],
        reports: []
      };
    }
  },

  // Guarda todo el JSON de forma atómica: escribe a un temporal y luego
  // renombra. Un corte a mitad de escritura deja el .tmp a medias pero nunca
  // corrompe el archivo real (rename es atómico en el mismo sistema de ficheros).
  _save(data) {
    try {
      const tmp = DB_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmp, DB_FILE);
    } catch (e) {
      console.error("Error al guardar la base de datos JSON:", e);
    }
  },

  // Obtener todas las filas de una tabla
  find(table, query = {}) {
    const data = this._load();
    const rows = data[table] || [];
    
    return rows.filter(row => {
      for (const key in query) {
        if (Array.isArray(query[key])) {
          // Si el query es un array, comprobar si coincide
          if (!query[key].includes(row[key])) return false;
        } else if (row[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
  },

  // Obtener una fila de una tabla
  findOne(table, query = {}) {
    const results = this.find(table, query);
    return results.length > 0 ? results[0] : null;
  },

  // Insertar una nueva fila
  insert(table, row) {
    const data = this._load();
    if (!data[table]) data[table] = [];

    // Generar ID único
    const newId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const newRow = { id: newId, ...row, createdAt: new Date().toISOString() };
    
    data[table].push(newRow);
    this._save(data);
    return newRow;
  },

  // Actualizar filas
  update(table, query, updateData) {
    const data = this._load();
    const rows = data[table] || [];
    let updatedCount = 0;

    const newRows = rows.map(row => {
      let matches = true;
      for (const key in query) {
        if (row[key] !== query[key]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        updatedCount++;
        return { ...row, ...updateData, updatedAt: new Date().toISOString() };
      }
      return row;
    });

    data[table] = newRows;
    this._save(data);
    return updatedCount;
  },

  // Eliminar filas
  delete(table, query) {
    const data = this._load();
    const rows = data[table] || [];
    const initialLength = rows.length;

    const newRows = rows.filter(row => {
      let matches = true;
      for (const key in query) {
        if (row[key] !== query[key]) {
          matches = false;
          break;
        }
      }
      return !matches; // conservar solo los que NO coinciden
    });

    data[table] = newRows;
    this._save(data);
    return initialLength - newRows.length;
  }
};

module.exports = db;
