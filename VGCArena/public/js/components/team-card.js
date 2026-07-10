// Helper para obtener URL del sprite seguro (mapeando Megas a sus IDs de Pokémon base para evitar imágenes rotas)
import { escapeHTML, safeAvatar, encodePath } from '../utils.js';

function getSpriteUrl(p) {
  let id = p.pokeapiId;
  const species = (p.species || '').toLowerCase().trim();
  
  const megaBaseIds = {
    "mega-venusaur": 3, "mega-charizard-x": 6, "mega-charizard-y": 6, "mega-blastoise": 9,
    "mega-beedrill": 15, "mega-pidgeot": 18, "mega-alakazam": 65, "mega-slowbro": 80,
    "mega-gengar": 94, "mega-kangaskhan": 115, "mega-pinsir": 127, "mega-gyarados": 130,
    "mega-aerodactyl": 142, "mega-ampharos": 181, "mega-scizor": 212, "mega-heracross": 214,
    "mega-houndoom": 229, "mega-tyranitar": 248, "mega-blaziken": 257, "mega-gardevoir": 282,
    "mega-mawile": 303, "mega-aggron": 306, "mega-medicham": 308, "mega-manectric": 310,
    "mega-sharpedo": 319, "mega-camerupt": 323, "mega-altaria": 334, "mega-banette": 354,
    "mega-absol": 359, "mega-glalie": 362, "mega-metagross": 376, "mega-lopunny": 428,
    "mega-garchomp": 445, "mega-lucario": 448, "mega-abomasnow": 460, "mega-steelix": 208,
    "mega-sceptile": 254, "mega-swampert": 260, "mega-sableye": 302, "mega-meganium": 154,
    "mega-excadrill": 530, "mega-greninja": 658, "mega-skarmory": 227, "mega-chimecho": 358,
    "mega-chandelure": 609, "mega-golurk": 623, "mega-victreebel": 71, "mega-starmie": 121,
    "mega-raichu-x": 26, "mega-raichu-y": 26, "mega-staraptor": 398, "mega-scolipede": 545,
    "mega-scrafty": 560, "mega-drampa": 780, "mega-froslass": 478, "mega-emboar": 500,
    "mega-chesnaught": 652, "mega-delphox": 655, "mega-dragonite": 149, "mega-eelektross": 604,
    "mega-pyroar": 668, "mega-eternal-floette": 670, "mega-garchomp-z": 445
  };
  
  if (megaBaseIds[species]) {
    id = megaBaseIds[species];
  }
  
  return p.isShiny
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export function renderTeamCard(team, index = 0) {
  const pokemonList = team.pokemon || [];
  
  const paddedPokemon = [...pokemonList];
  while (paddedPokemon.length < 6) {
    paddedPokemon.push(null);
  }

  const pokemonGridHTML = paddedPokemon.map(p => {
    if (!p) {
      return `<div class="poke-sprite-mini" style="opacity: 0.3;"><span style="font-size: 0.8rem;">?</span></div>`;
    }
    
    const spriteUrl = getSpriteUrl(p);

    return `
      <div class="poke-sprite-mini" title="${p.species.toUpperCase()} @ ${p.item}">
        <img src="${spriteUrl}" alt="${p.species}" loading="lazy">
        <span class="tera-badge" style="background-color: var(--type-${p.teraType.toLowerCase() || 'normal'});" title="Tera tipo ${p.teraType}">
          ${p.teraType.substr(0, 2).toUpperCase()}
        </span>
      </div>
    `;
  }).join('');

  const tagsHTML = (team.tags || []).slice(0, 3).map(tag => {
    return `<span class="tag-badge">${escapeHTML(tag)}</span>`;
  }).join('');

  const avgStrength = team.avgStrength || '0.0';
  const avgOriginality = team.avgOriginality || '0.0';
  const creatorName = escapeHTML(team.creator ? team.creator.username : 'Entrenador');
  const creatorPath = encodePath(team.creator ? team.creator.username : 'Entrenador');
  const creatorAvatar = safeAvatar(team.creator ? team.creator.avatar : null);

  const delayClass = `stagger-${(index % 6) + 1}`;

  return `
    <article class="card animate-fade-in ${delayClass}" style="display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div class="pokemon-grid-preview">
          ${pokemonGridHTML}
        </div>
        
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: var(--space-2);">
          <img src="${creatorAvatar}" alt="${creatorName}" style="width: 20px; height: 20px; border-radius: 50%;">
          <span style="font-size: 0.8rem; color: var(--text-tertiary);">por <a href="/profile/${creatorPath}" data-link style="font-weight: 600;">@${creatorName}</a></span>
        </div>
        
        <h3 style="margin-bottom: var(--space-2); font-size: 1.15rem; line-height: 1.3;">
          <a href="/team/${team.id}" data-link style="color: var(--text-primary);">${escapeHTML(team.name)}</a>
        </h3>
        
        <div style="font-size: 0.8rem; color: var(--text-tertiary); display: flex; gap: var(--space-3); margin-bottom: var(--space-3);">
          <span>${team.regSetId.toUpperCase()}</span>
          <span>•</span>
          <span>${team.format}</span>
        </div>

        <p style="font-size: 0.85rem; color: var(--text-secondary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: var(--space-3); line-height: 1.5;">
          ${team.description ? escapeHTML(team.description) : 'Sin descripción de estrategia disponible.'}
        </p>
      </div>

      <div>
        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: var(--space-4);">
          ${tagsHTML}
        </div>
        
        <div style="border-top: 1px solid var(--border-subtle); padding-top: var(--space-3); display: flex; justify-content: space-between; align-items: center;">
          <div class="rating-display" style="margin-top: 0;">
            <div class="rating-item" title="Fuerza competitiva">
              <span style="color: var(--warning);">⚔️</span>
              <span class="rating-value">${avgStrength}</span>
            </div>
            <div class="rating-item" title="Originalidad">
              <span style="color: var(--accent-secondary);">✨</span>
              <span class="rating-value">${avgOriginality}</span>
            </div>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary); display: flex; gap: var(--space-2);">
            <span>👁 ${team.viewCount || 0}</span>
            <span>💬 ${team.totalVotes || 0}</span>
          </div>
        </div>
      </div>
    </article>
  `;
}
