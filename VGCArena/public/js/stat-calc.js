import { getStatDefinitions } from './move-localization.js';

// Nivel e IVs estándar asumidos para el cálculo competitivo mostrado en la UI
// (VGC usa Nivel 50 y se asume IV perfecto de 31 salvo que el usuario indique lo contrario).
const ASSUMED_LEVEL = 50;
const ASSUMED_IV = 31;

// Tabla estándar de naturalezas: estadística que sube (x1.1) y la que baja (x0.9).
// Las 5 naturalezas neutras (hardy, docile, serious, bashful, quirky) no aparecen aquí.
const NATURE_MODIFIERS = {
  lonely: { boost: 'attack', drop: 'defense' },
  brave: { boost: 'attack', drop: 'speed' },
  adamant: { boost: 'attack', drop: 'special-attack' },
  naughty: { boost: 'attack', drop: 'special-defense' },
  bold: { boost: 'defense', drop: 'attack' },
  relaxed: { boost: 'defense', drop: 'speed' },
  impish: { boost: 'defense', drop: 'special-attack' },
  lax: { boost: 'defense', drop: 'special-defense' },
  timid: { boost: 'speed', drop: 'attack' },
  hasty: { boost: 'speed', drop: 'defense' },
  jolly: { boost: 'speed', drop: 'special-attack' },
  naive: { boost: 'speed', drop: 'special-defense' },
  modest: { boost: 'special-attack', drop: 'attack' },
  mild: { boost: 'special-attack', drop: 'defense' },
  quiet: { boost: 'special-attack', drop: 'speed' },
  rash: { boost: 'special-attack', drop: 'special-defense' },
  calm: { boost: 'special-defense', drop: 'attack' },
  gentle: { boost: 'special-defense', drop: 'defense' },
  sassy: { boost: 'special-defense', drop: 'speed' },
  careful: { boost: 'special-defense', drop: 'special-attack' }
};

function getNatureMultiplier(nature, statKey) {
  const mod = NATURE_MODIFIERS[(nature || '').toLowerCase()];
  if (!mod) return 1;
  if (mod.boost === statKey) return 1.1;
  if (mod.drop === statKey) return 0.9;
  return 1;
}

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

// Fórmula estándar de cálculo de estadísticas de Pokémon (Nivel 50, IV 31 asumidos).
function calculateStat(statKey, baseStats, evs, nature) {
  const base = getBaseStatValue(baseStats, statKey);
  const ev = getEvValue(evs, statKey);

  if (statKey === 'hp') {
    return Math.floor(((2 * base + ASSUMED_IV + Math.floor(ev / 4)) * ASSUMED_LEVEL) / 100) + ASSUMED_LEVEL + 10;
  }

  const natureMultiplier = getNatureMultiplier(nature, statKey);
  const rawStat = Math.floor(((2 * base + ASSUMED_IV + Math.floor(ev / 4)) * ASSUMED_LEVEL) / 100) + 5;
  return Math.floor(rawStat * natureMultiplier);
}

// Máximo teórico de referencia para escalar el ancho de las barras visualmente.
const STAT_BAR_MAX = 260;

// Genera el HTML de las barras de estadísticas de un Pokémon: valor final calculado
// (Nivel 50 / IV 31), barra proporcional, y el desglose de EVs invertidos por stat.
export function renderStatBars(baseStats, evs, nature) {
  const statDefinitions = getStatDefinitions();

  return `
    <div style="display: flex; flex-direction: column; gap: 4px;">
      ${statDefinitions.map(stat => {
        const finalStat = calculateStat(stat.key, baseStats, evs, nature);
        const evValue = getEvValue(evs, stat.key);
        const barWidth = Math.min(100, Math.round((finalStat / STAT_BAR_MAX) * 100));
        const natureMod = getNatureMultiplier(nature, stat.key);
        const natureColor = natureMod > 1 ? 'var(--success, #4caf50)' : (natureMod < 1 ? 'var(--danger, #e05252)' : 'var(--accent-primary)');

        return `
          <div style="display: flex; align-items: center; gap: 6px; font-size: 0.72rem;">
            <span style="width: 62px; flex-shrink: 0; color: var(--text-tertiary);">${stat.shortLabel}</span>
            <div style="flex: 1; background: var(--bg-void); border-radius: 4px; height: 8px; overflow: hidden;">
              <div style="width: ${barWidth}%; height: 100%; background: ${natureColor}; border-radius: 4px;"></div>
            </div>
            <span style="width: 34px; text-align: right; font-weight: 700; color: var(--text-primary); flex-shrink: 0;">${finalStat}</span>
            <span style="width: 44px; text-align: right; color: var(--text-tertiary); flex-shrink: 0;">${evValue > 0 ? `+${evValue} EV` : ''}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

export { calculateStat, getNatureMultiplier };
