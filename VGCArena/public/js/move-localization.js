const MOVE_LANGUAGE_KEY = 'vgc-move-language';

const translationCache = new Map();
const pendingRequests = new Map();
const reverseLookup = new Map();

function createCategoryStore() {
  return {
    cache: new Map(),
    pending: new Map(),
    reverse: new Map()
  };
}

const abilityStore = createCategoryStore();
const itemStore = createCategoryStore();
const typeStore = createCategoryStore();
const natureStore = createCategoryStore();

const STAT_DEFINITIONS = [
  { key: 'hp', en: 'HP', es: 'PS' },
  { key: 'attack', en: 'Attack', es: 'Ataque' },
  { key: 'defense', en: 'Defense', es: 'Defensa' },
  { key: 'special-attack', en: 'Sp. Atk', es: 'At. Esp.' },
  { key: 'special-defense', en: 'Sp. Def', es: 'Def. Esp.' },
  { key: 'speed', en: 'Speed', es: 'Velocidad' }
];

const NATURE_IDENTIFIERS = [
  'hardy', 'lonely', 'brave', 'adamant', 'naughty',
  'bold', 'docile', 'relaxed', 'impish', 'lax',
  'timid', 'hasty', 'serious', 'jolly', 'naive',
  'modest', 'mild', 'quiet', 'bashful', 'rash',
  'calm', 'gentle', 'sassy', 'careful', 'quirky'
];

const MOVE_ALIASES = {
  uturn: 'u-turn'
};

function normalizeText(value = '') {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function humanizeMoveName(name = '') {
  return name.replace(/-/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

function resolvePokeApiIdentifier(value = '') {
  return normalizeText(value).replace(/ /g, '-');
}

function getMoveLanguage() {
  if (typeof window === 'undefined') return 'es';
  const stored = window.localStorage.getItem(MOVE_LANGUAGE_KEY);
  return stored === 'en' ? 'en' : 'es';
}

function setMoveLanguage(language) {
  if (typeof window === 'undefined') return 'es';
  const normalized = language === 'en' ? 'en' : 'es';
  window.localStorage.setItem(MOVE_LANGUAGE_KEY, normalized);
  return normalized;
}

function resolveMoveIdentifier(moveName = '') {
  const normalized = normalizeText(moveName).replace(/ /g, '-');
  return MOVE_ALIASES[normalized] || normalized;
}

function registerLookup(record) {
  const aliases = [record.name, record.en, record.es, record.enRaw, record.esRaw]
    .filter(Boolean)
    .map(value => normalizeText(value));

  aliases.forEach(alias => reverseLookup.set(alias, record.name));
  reverseLookup.set(normalizeText(record.labelEnEs), record.name);
  reverseLookup.set(normalizeText(record.labelEsEn), record.name);
}

function buildDisplayLabels(record) {
  return {
    labelEnEs: `${record.en} / ${record.es}`,
    labelEsEn: `${record.es} / ${record.en}`,
    displayPrimaryEnEs: record.en,
    displaySecondaryEnEs: record.es,
    displayPrimaryEsEn: record.es,
    displaySecondaryEsEn: record.en
  };
}

async function fetchMoveRecord(moveName) {
  const canonicalName = resolveMoveIdentifier(moveName);
  if (translationCache.has(canonicalName)) {
    return translationCache.get(canonicalName);
  }

  if (pendingRequests.has(canonicalName)) {
    return pendingRequests.get(canonicalName);
  }

  const request = (async () => {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/move/${canonicalName}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const spanishEntry = Array.isArray(data.names)
        ? data.names.find(entry => entry.language && entry.language.name === 'es')
        : null;

      const record = {
        name: data.name,
        en: humanizeMoveName(data.name),
        es: spanishEntry ? spanishEntry.name : humanizeMoveName(data.name),
        enRaw: data.name,
        esRaw: spanishEntry ? spanishEntry.name : ''
      };

      const labels = buildDisplayLabels(record);
      record.labelEnEs = labels.labelEnEs;
      record.labelEsEn = labels.labelEsEn;
      record.displayPrimaryEnEs = labels.displayPrimaryEnEs;
      record.displaySecondaryEnEs = labels.displaySecondaryEnEs;
      record.displayPrimaryEsEn = labels.displayPrimaryEsEn;
      record.displaySecondaryEsEn = labels.displaySecondaryEsEn;
      translationCache.set(record.name, record);
      registerLookup(record);
      return record;
    } catch (err) {
      const fallback = {
        name: canonicalName,
        en: humanizeMoveName(canonicalName),
        es: humanizeMoveName(canonicalName),
        enRaw: canonicalName,
        esRaw: humanizeMoveName(canonicalName)
      };

      const labels = buildDisplayLabels(fallback);
      fallback.labelEnEs = labels.labelEnEs;
      fallback.labelEsEn = labels.labelEsEn;
      fallback.displayPrimaryEnEs = labels.displayPrimaryEnEs;
      fallback.displaySecondaryEnEs = labels.displaySecondaryEnEs;
      fallback.displayPrimaryEsEn = labels.displayPrimaryEsEn;
      fallback.displaySecondaryEsEn = labels.displaySecondaryEsEn;
      translationCache.set(fallback.name, fallback);
      registerLookup(fallback);
      return fallback;
    } finally {
      pendingRequests.delete(canonicalName);
    }
  })();

  pendingRequests.set(canonicalName, request);
  return request;
}

async function warmMoveTranslations(moveNames = []) {
  const uniqueMoves = [...new Set(moveNames.filter(Boolean).map(resolveMoveIdentifier))];
  await Promise.all(uniqueMoves.map(moveName => fetchMoveRecord(moveName)));
}

function getMoveLabel(moveName, language = getMoveLanguage()) {
  const canonicalName = resolveMoveIdentifier(moveName);
  const record = translationCache.get(canonicalName);
  if (!record) {
    return humanizeMoveName(canonicalName);
  }

  return language === 'en' ? record.labelEnEs : record.labelEsEn;
}

function getMoveEntries(moveNames = [], language = getMoveLanguage()) {
  return moveNames
    .filter(Boolean)
    .map(moveName => {
      const canonicalName = resolveMoveIdentifier(moveName);
      const record = translationCache.get(canonicalName);
      if (!record) {
        const humanized = humanizeMoveName(canonicalName);
        return {
          name: canonicalName,
          label: `${humanized} / ${humanized}`,
          displayPrimary: humanized,
          displaySecondary: humanized,
          searchText: `${canonicalName} ${humanized}`
        };
      }

      const languageIsEnglishFirst = language === 'en';
      return {
        name: record.name,
        label: languageIsEnglishFirst ? record.labelEnEs : record.labelEsEn,
        displayPrimary: languageIsEnglishFirst ? record.displayPrimaryEnEs : record.displayPrimaryEsEn,
        displaySecondary: languageIsEnglishFirst ? record.displaySecondaryEnEs : record.displaySecondaryEsEn,
        searchText: `${record.name} ${record.en} ${record.es} ${record.labelEnEs} ${record.labelEsEn}`
      };
    });
}

function canonicalizeMoveName(value = '') {
  const normalized = normalizeText(value);
  if (!normalized) return '';

  if (reverseLookup.has(normalized)) {
    return reverseLookup.get(normalized);
  }

  const slashParts = normalized.split('/').map(part => part.trim()).filter(Boolean);
  for (const part of slashParts) {
    if (reverseLookup.has(part)) {
      return reverseLookup.get(part);
    }
  }

  return resolveMoveIdentifier(value);
}

function registerStoreLookup(store, record) {
  const aliases = [record.name, record.en, record.es, record.enRaw, record.esRaw]
    .filter(Boolean)
    .map(value => normalizeText(value));

  aliases.forEach(alias => store.reverse.set(alias, record.name));
  store.reverse.set(normalizeText(record.labelEnEs), record.name);
  store.reverse.set(normalizeText(record.labelEsEn), record.name);
}

function buildStoreLabels(record) {
  return {
    labelEnEs: `${record.en} / ${record.es}`,
    labelEsEn: `${record.es} / ${record.en}`,
    displayPrimaryEnEs: record.en,
    displaySecondaryEnEs: record.es,
    displayPrimaryEsEn: record.es,
    displaySecondaryEsEn: record.en
  };
}

function getStatLabel(statName = '', language = getMoveLanguage()) {
  const definition = STAT_DEFINITIONS.find(stat => stat.key === normalizeText(statName));
  if (!definition) return humanizeMoveName(statName);
  return language === 'en' ? `${definition.en} / ${definition.es}` : `${definition.es} / ${definition.en}`;
}

function getStatShortLabel(statName = '', language = getMoveLanguage()) {
  const definition = STAT_DEFINITIONS.find(stat => stat.key === normalizeText(statName));
  if (!definition) return humanizeMoveName(statName);
  return language === 'en' ? definition.en : definition.es;
}

function formatNatureEffect(boostStat, dropStat) {
  const boost = boostStat ? `+${getStatShortLabel(boostStat, 'en')}` : '';
  const drop = dropStat ? `-${getStatShortLabel(dropStat, 'en')}` : '';
  if (!boost && !drop) return '';
  return `${boost}${boost && drop ? ' / ' : ''}${drop}`;
}

function buildNatureLabels(record) {
  const effect = formatNatureEffect(record.boostStat, record.dropStat);
  return {
    labelEnEs: effect ? `${record.en} / ${record.es} (${effect})` : `${record.en} / ${record.es}`,
    labelEsEn: effect ? `${record.es} / ${record.en} (${effect})` : `${record.es} / ${record.en}`,
    displayPrimaryEnEs: record.en,
    displaySecondaryEnEs: record.es,
    displayPrimaryEsEn: record.es,
    displaySecondaryEsEn: record.en,
    effect
  };
}

async function fetchLocalizedRecord(store, endpoint, value) {
  const canonicalName = resolvePokeApiIdentifier(value);
  if (store.cache.has(canonicalName)) {
    return store.cache.get(canonicalName);
  }

  if (store.pending.has(canonicalName)) {
    return store.pending.get(canonicalName);
  }

  const request = (async () => {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/${endpoint}/${canonicalName}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const spanishEntry = Array.isArray(data.names)
        ? data.names.find(entry => entry.language && entry.language.name === 'es')
        : null;

      const record = {
        name: data.name,
        en: humanizeMoveName(data.name),
        es: spanishEntry ? spanishEntry.name : humanizeMoveName(data.name),
        enRaw: data.name,
        esRaw: spanishEntry ? spanishEntry.name : ''
      };

      if (endpoint === 'nature') {
        record.boostStat = data.increased_stat ? data.increased_stat.name : null;
        record.dropStat = data.decreased_stat ? data.decreased_stat.name : null;
      }

      const labels = endpoint === 'nature' ? buildNatureLabels(record) : buildStoreLabels(record);
      Object.assign(record, labels);
      store.cache.set(record.name, record);
      registerStoreLookup(store, record);
      return record;
    } catch (err) {
      const fallback = {
        name: canonicalName,
        en: humanizeMoveName(canonicalName),
        es: humanizeMoveName(canonicalName),
        enRaw: canonicalName,
        esRaw: humanizeMoveName(canonicalName)
      };

      if (endpoint === 'nature') {
        fallback.boostStat = null;
        fallback.dropStat = null;
      }

      const labels = endpoint === 'nature' ? buildNatureLabels(fallback) : buildStoreLabels(fallback);
      Object.assign(fallback, labels);
      store.cache.set(fallback.name, fallback);
      registerStoreLookup(store, fallback);
      return fallback;
    } finally {
      store.pending.delete(canonicalName);
    }
  })();

  store.pending.set(canonicalName, request);
  return request;
}

async function warmLocalizedTranslations(store, endpoint, values = []) {
  const uniqueValues = [...new Set(values.filter(Boolean).map(resolvePokeApiIdentifier))];
  await Promise.all(uniqueValues.map(value => fetchLocalizedRecord(store, endpoint, value)));
}

async function warmAbilityTranslations(values = []) {
  return warmLocalizedTranslations(abilityStore, 'ability', values);
}

async function warmItemTranslations(values = []) {
  return warmLocalizedTranslations(itemStore, 'item', values);
}

async function warmTypeTranslations(values = []) {
  return warmLocalizedTranslations(typeStore, 'type', values);
}

async function warmNatureTranslations(values = NATURE_IDENTIFIERS) {
  return warmLocalizedTranslations(natureStore, 'nature', values);
}

function getLocalizedLabel(value, store, language = getMoveLanguage()) {
  const canonicalName = resolvePokeApiIdentifier(value);
  const record = store.cache.get(canonicalName);
  if (!record) {
    return humanizeMoveName(canonicalName);
  }

  return language === 'en' ? record.labelEnEs : record.labelEsEn;
}

function getLocalizedEntries(values = [], store, language = getMoveLanguage()) {
  return values
    .filter(Boolean)
    .map(value => {
      const canonicalName = resolvePokeApiIdentifier(value);
      const record = store.cache.get(canonicalName);
      if (!record) {
        const humanized = humanizeMoveName(canonicalName);
        return {
          name: canonicalName,
          label: `${humanized} / ${humanized}`,
          displayPrimary: humanized,
          displaySecondary: humanized,
          searchText: `${canonicalName} ${humanized}`
        };
      }

      const languageIsEnglishFirst = language === 'en';
      return {
        name: record.name,
        label: languageIsEnglishFirst ? record.labelEnEs : record.labelEsEn,
        displayPrimary: languageIsEnglishFirst ? record.displayPrimaryEnEs : record.displayPrimaryEsEn,
        displaySecondary: languageIsEnglishFirst ? record.displaySecondaryEnEs : record.displaySecondaryEsEn,
        searchText: `${record.name} ${record.en} ${record.es} ${record.labelEnEs} ${record.labelEsEn}`
      };
    });
}

function canonicalizeLocalizedName(value, store) {
  const normalized = normalizeText(value);
  if (!normalized) return '';

  if (store.reverse.has(normalized)) {
    return store.reverse.get(normalized);
  }

  const slashParts = normalized.split('/').map(part => part.trim()).filter(Boolean);
  for (const part of slashParts) {
    if (store.reverse.has(part)) {
      return store.reverse.get(part);
    }
  }

  return resolvePokeApiIdentifier(value);
}

function canonicalizeAbilityName(value = '') {
  return canonicalizeLocalizedName(value, abilityStore);
}

function canonicalizeItemName(value = '') {
  return canonicalizeLocalizedName(value, itemStore);
}

function canonicalizeTypeName(value = '') {
  return canonicalizeLocalizedName(value, typeStore);
}

function canonicalizeNatureName(value = '') {
  return canonicalizeLocalizedName(value, natureStore);
}

function getAbilityLabel(value, language = getMoveLanguage()) {
  return getLocalizedLabel(value, abilityStore, language);
}

function getItemLabel(value, language = getMoveLanguage()) {
  return getLocalizedLabel(value, itemStore, language);
}

function getTypeLabel(value, language = getMoveLanguage()) {
  return getLocalizedLabel(value, typeStore, language);
}

function getNatureLabel(value, language = getMoveLanguage()) {
  return getLocalizedLabel(value, natureStore, language);
}

function getAbilityEntries(values = [], language = getMoveLanguage()) {
  return getLocalizedEntries(values, abilityStore, language);
}

function getItemEntries(values = [], language = getMoveLanguage()) {
  return getLocalizedEntries(values, itemStore, language);
}

function getTypeEntries(values = [], language = getMoveLanguage()) {
  return getLocalizedEntries(values, typeStore, language);
}

function getNatureEntries(values = NATURE_IDENTIFIERS, language = getMoveLanguage()) {
  return getLocalizedEntries(values, natureStore, language);
}

function getStatDefinitions(language = getMoveLanguage()) {
  return STAT_DEFINITIONS.map(stat => ({
    key: stat.key,
    label: language === 'en' ? `${stat.en} / ${stat.es}` : `${stat.es} / ${stat.en}`,
    shortLabel: language === 'en' ? stat.en : stat.es,
    en: stat.en,
    es: stat.es
  }));
}

export {
  canonicalizeAbilityName,
  canonicalizeItemName,
  canonicalizeNatureName,
  canonicalizeTypeName,
  canonicalizeMoveName,
  getAbilityEntries,
  getAbilityLabel,
  getItemEntries,
  getItemLabel,
  getNatureEntries,
  getNatureLabel,
  getStatDefinitions,
  getStatLabel,
  getTypeEntries,
  getTypeLabel,
  getMoveEntries,
  getMoveLabel,
  getMoveLanguage,
  setMoveLanguage,
  warmAbilityTranslations,
  warmItemTranslations,
  warmNatureTranslations,
  warmTypeTranslations,
  warmLocalizedTranslations,
  warmMoveTranslations
};