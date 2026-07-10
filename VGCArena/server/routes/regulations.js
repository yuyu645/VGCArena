const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Rutas a archivos JSON
const REGS_INDEX = path.join(__dirname, '../../data/regulations/index.json');
const ITEMS_FILE = path.join(__dirname, '../../data/items.json');
const TERA_FILE = path.join(__dirname, '../../data/tera-types.json');
const TAGS_FILE = path.join(__dirname, '../../data/tags.json');

// Obtener todas las regulaciones
router.get('/', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(REGS_INDEX, 'utf-8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al cargar las regulaciones.' });
  }
});

// Obtener una regulación específica (con allowlist de Pokémon)
router.get('/:id', (req, res) => {
  const regId = req.params.id;
  const regPath = path.join(__dirname, `../../data/regulations/${regId}.json`);

  if (!fs.existsSync(regPath)) {
    return res.status(404).json({ error: 'Regulation Set no encontrado.' });
  }

  try {
    const data = JSON.parse(fs.readFileSync(regPath, 'utf-8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al cargar la regulación específica.' });
  }
});

// Obtener constantes (items, tera types, tags)
router.get('/meta/constants', (req, res) => {
  try {
    const items = JSON.parse(fs.readFileSync(ITEMS_FILE, 'utf-8'));
    const teraTypes = JSON.parse(fs.readFileSync(TERA_FILE, 'utf-8')).types;
    const tags = JSON.parse(fs.readFileSync(TAGS_FILE, 'utf-8')).tags;

    res.json({ items, teraTypes, tags });
  } catch (err) {
    res.status(500).json({ error: 'Error al cargar constantes meta.' });
  }
});

module.exports = router;
