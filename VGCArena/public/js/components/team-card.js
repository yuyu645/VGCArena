// Helper para obtener URL del sprite seguro (mapeando Megas a sus IDs de Pokémon base para evitar imágenes rotas)
import { escapeHTML, safeAvatar, encodePath } from '../utils.js';
import { getItemLabel, getMoveLanguage, getTypeLabel } from '../move-localization.js';
import { getSpriteUrl as getSharedSpriteUrl } from '../mega-data.js';

function getSpriteUrl(p) {
  return getSharedSpriteUrl(p.pokeapiId, p.species, p.isShiny);
}

export function renderTeamCard(team, index = 0) {
  const pokemonList = team.pokemon || [];
  const language = getMoveLanguage();
  
  const paddedPokemon = [...pokemonList];
  while (paddedPokemon.length < 6) {
    paddedPokemon.push(null);
  }

  const pokemonGridHTML = paddedPokemon.map(p => {
    if (!p) {
      return `<div class="poke-sprite-mini" style="opacity: 0.3;"><span style="font-size: 0.8rem;">?</span></div>`;
    }
    
    const spriteUrl = getSpriteUrl(p);
    const typeBadges = (p.types || []).slice(0, 2).map(type => `
      <span class="type-badge" style="background-color: var(--type-${type.toLowerCase()}); font-size: 0.65rem; padding: 2px 6px;" title="${getTypeLabel(type, language)}">
        ${getTypeLabel(type, language).split(' / ')[0]}
      </span>
    `).join('');

    return `
      <div class="poke-sprite-mini" title="${p.species.toUpperCase()} @ ${p.item ? getItemLabel(p.item, language) : 'Ninguno / None'}">
        <img src="${spriteUrl}" alt="${p.species}" loading="lazy">
        <div style="display: flex; gap: 2px; flex-wrap: wrap; justify-content: center; margin-top: 4px;">
          ${typeBadges}
        </div>
        <span class="tera-badge" style="background-color: var(--type-${p.teraType.toLowerCase() || 'normal'});" title="${getTypeLabel(p.teraType || 'Normal', language)}">
          ${getTypeLabel(p.teraType || 'Normal', language).substr(0, 2).toUpperCase()}
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
    <article class="card team-card animate-fade-in ${delayClass}">
      <div>
        <div class="pokemon-grid-preview">
          ${pokemonGridHTML}
        </div>

        <div class="team-card-author">
          <img src="${creatorAvatar}" alt="" loading="lazy">
          <span>por <a href="/profile/${creatorPath}" data-link style="font-weight: 600;">@${creatorName}</a></span>
        </div>

        <h3 class="team-card-title">
          <a href="/team/${team.id}" data-link>${escapeHTML(team.name)}</a>
        </h3>

        <div class="team-card-meta">
          <span>${team.regSetId.toUpperCase()}</span>
          <span aria-hidden="true">•</span>
          <span>${team.format}</span>
        </div>

        <p class="team-card-desc">
          ${team.description ? escapeHTML(team.description) : 'Sin descripción de estrategia disponible.'}
        </p>
      </div>

      <div>
        <div class="team-card-tags">
          ${tagsHTML}
        </div>

        <div class="team-card-footer">
          <div class="rating-display" style="margin-top: 0;">
            <div class="rating-item" title="Fuerza competitiva">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.8-3.2 8-7 10-3.8-2-7-5.2-7-10V6z"/></svg>
              <span class="rating-value">${avgStrength}</span>
            </div>
            <div class="rating-item" title="Originalidad">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent-secondary)" aria-hidden="true"><path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z"/></svg>
              <span class="rating-value">${avgOriginality}</span>
            </div>
          </div>
          <div class="team-card-stats">
            <span title="Vistas" style="display: inline-flex; align-items: center; gap: 4px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
              ${team.viewCount || 0}
            </span>
            <span title="Votos" style="display: inline-flex; align-items: center; gap: 4px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-2.9-.4-4.1-1L3 20l1-5.4A8.5 8.5 0 1 1 21 11.5z"/></svg>
              ${team.totalVotes || 0}
            </span>
          </div>
        </div>
      </div>
    </article>
  `;
}
