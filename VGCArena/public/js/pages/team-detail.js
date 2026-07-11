import api from '../api.js';
import { escapeHTML, safeAvatar, encodePath } from '../utils.js';
import skeleton from '../components/skeleton.js';
import starRating from '../components/star-rating.js';
import commentThread from '../components/comment-thread.js';
import toast from '../components/toast.js';
import { getAbilityLabel, getItemLabel, getMoveLabel, getMoveLanguage, getTypeLabel, setMoveLanguage, warmAbilityTranslations, warmItemTranslations, warmMoveTranslations, warmTypeTranslations } from '../move-localization.js';
import { getSpriteUrl } from '../mega-data.js';
import { renderStatBars } from '../stat-calc.js';
import auth from '../auth.js';

let currentTeam = null;
let currentTeamParams = null;

const SHOWDOWN_STAT_ABBR = {
  hp: 'HP', attack: 'Atk', defense: 'Def',
  'special-attack': 'SpA', 'special-defense': 'SpD', speed: 'Spe'
};

function humanizeName(name = '') {
  return name.replace(/-/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

// Genera el equipo en formato de texto de Pokémon Showdown, listo para pegar
// en el importador de equipos de un simulador.
function buildShowdownExport(team) {
  return (team.pokemon || []).map(p => {
    const itemPart = p.item && p.item !== 'Ninguno' ? ` @ ${humanizeName(p.item)}` : '';
    const evsEntries = Object.entries(p.evs || {})
      .filter(([, val]) => Number(val) > 0)
      .map(([key, val]) => `${val} ${SHOWDOWN_STAT_ABBR[key] || key}`);
    const evsLine = evsEntries.length > 0 ? `EVs: ${evsEntries.join(' / ')}\n` : '';
    const natureLine = `${humanizeName(p.nature || 'Hardy')} Nature\n`;
    const movesLines = (p.moves || []).map(m => `- ${humanizeName(m)}`).join('\n');

    return `${humanizeName(p.species)}${itemPart}\nAbility: ${humanizeName(p.ability || '')}\nLevel: 50\nTera Type: ${humanizeName(p.teraType || 'Normal')}\n${evsLine}${natureLine}${movesLines}`;
  }).join('\n\n');
}

async function teamDetailPage(params) {
  return `
    <div>
      <div id="team-detail-container">
        ${skeleton.detail()}
      </div>

      <div id="report-modal" class="modal">
        <div class="modal-content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
            <h3 style="font-size: 1.25rem;">Reportar Equipo Inapropiado</h3>
            <button class="btn btn-secondary btn-sm" onclick="window.teamDetailPage.closeReportModal()" style="padding: 4px 8px;">✕</button>
          </div>
          
          <div class="form-group">
            <label class="form-label">Razón del Reporte</label>
            <textarea id="report-reason" class="form-input" rows="3" placeholder="Describe por qué consideras que este contenido es inapropiado (ej. lenguaje ofensivo, spam, acoso)..." style="resize: vertical;"></textarea>
          </div>
          
          <div style="margin-top: var(--space-4); display: flex; justify-content: flex-end; gap: var(--space-2);">
            <button class="btn btn-secondary" onclick="window.teamDetailPage.closeReportModal()">Cancelar</button>
            <button id="submit-report-btn" class="btn btn-danger">Enviar Reporte</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

teamDetailPage.init = async function(params) {
  currentTeamParams = params;
  const container = document.getElementById('team-detail-container');
  if (!container) return;

  try {
    const teamId = params.id;
    const team = await api.get(`/teams/${teamId}`);
    currentTeam = team;

    let regsetDataIncomplete = false;
    try {
      const regsData = await api.get('/regulations');
      const teamReg = (regsData.regulations || []).find(r => r.id === team.regSetId);
      regsetDataIncomplete = !!(teamReg && teamReg.dataIncomplete);
    } catch (err) {
      // Si falla, simplemente no mostramos el aviso de datos incompletos.
    }
    await warmMoveTranslations((team.pokemon || []).flatMap(p => p.moves || []));
    await warmAbilityTranslations((team.pokemon || []).flatMap(p => [p.ability].filter(Boolean)));
    await warmItemTranslations((team.pokemon || []).flatMap(p => [p.item].filter(Boolean)));
    await warmTypeTranslations((team.pokemon || []).flatMap(p => [...(p.types || []), p.teraType].filter(Boolean)));
    const moveLanguage = getMoveLanguage();

    const creatorName = escapeHTML(team.creator ? team.creator.username : 'Entrenador');
    const creatorPath = encodePath(team.creator ? team.creator.username : 'Entrenador');
    const creatorAvatar = safeAvatar(team.creator ? team.creator.avatar : null);
    const creatorRep = team.creator ? team.creator.reputation : 0;

    const currentUser = auth.getUser();
    const isAuthenticated = auth.isAuthenticated();
    const isOwnTeam = !!(currentUser && team.userId === currentUser.id);
    
    const tagsHTML = (team.tags || []).map(t => `<span class="tag-badge" style="font-size: 0.8rem; padding: 4px 10px;">${t}</span>`).join('');

    const pokemonCardsHTML = (team.pokemon || []).map(p => {
      const spriteUrl = getSpriteUrl(p.pokeapiId, p.species, p.isShiny);
      const typeBadges = (p.types || []).slice(0, 2).map(type => `
        <span class="type-badge" title="${getTypeLabel(type, moveLanguage)}" style="background-color: var(--type-${type.toLowerCase()}); font-size: 0.65rem; padding: 2px 6px;">
          ${getTypeLabel(type, moveLanguage)}
        </span>
      `).join('');

      return `
        <div class="detail-pokemon-card card" style="display: flex; gap: var(--space-4); align-items: center;">
          <div class="sprite-container">
            <img src="${spriteUrl}" alt="${p.species}">
            ${p.isShiny ? '<span style="font-size: 0.72rem; color: var(--accent-secondary); font-weight: 700; margin-top: -6px; text-transform: uppercase; letter-spacing: 0.05em;">Shiny</span>' : ''}
          </div>
          <div class="meta-info" style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
              <h4 style="text-transform: uppercase; font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">${p.species}</h4>
              <span class="type-badge" title="${getTypeLabel(p.teraType || 'Normal', moveLanguage)}" style="background-color: var(--type-${p.teraType.toLowerCase() || 'normal'}); font-size: 0.65rem; padding: 2px 6px;">
                Tera: ${getTypeLabel(p.teraType || 'Normal', moveLanguage)}
              </span>
            </div>

            <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 2px;">
              ${typeBadges}
            </div>
            
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 4px;">
              <div><strong>Objeto / Item:</strong> ${p.item ? getItemLabel(p.item, moveLanguage) : 'Ninguno / None'}</div>
              <div><strong>Habilidad / Ability:</strong> ${p.ability ? getAbilityLabel(p.ability, moveLanguage) : '—'}</div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 4px;">
              ${(p.moves || []).map(m => `
                <div style="background-color: var(--bg-void); border: 1px solid var(--border-subtle); padding: 4px 8px; border-radius: var(--radius-sm); font-size: 0.8rem; font-family: var(--font-mono); text-transform: capitalize; color: var(--text-primary);">
                  ${getMoveLabel(m, moveLanguage)}
                </div>
              `).join('')}
            </div>

            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--border-subtle);">
              ${renderStatBars(p.baseStats, p.evs, p.nature)}
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div>
        <!-- Cabecera -->
        <div class="team-details-header card" style="background-color: var(--bg-surface); padding: var(--space-5); margin-bottom: var(--space-5);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-3);">
            <div>
              <span style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--accent-secondary); letter-spacing: 0.05em; display: block; margin-bottom: 4px;">
                ${team.regSetId.toUpperCase()} • ${team.format}
              </span>
              ${regsetDataIncomplete ? `
                <div style="font-size: 0.8rem; color: var(--text-secondary); background: var(--bg-elevated); border: 1px solid var(--accent-warning, #d9a441); border-radius: var(--radius-sm); padding: 4px 8px; margin-bottom: 8px; display: inline-block;">
                  ⚠️ Datos de Pokémon legales parciales para este Regulation Set
                </div>
              ` : ''}
              <h1 style="font-size: 2rem; font-weight: 800; margin-bottom: 6px;">${escapeHTML(team.name)}</h1>
              
              <div style="display: flex; align-items: center; gap: 8px;">
                <img src="${creatorAvatar}" alt="${creatorName}" style="width: 24px; height: 24px; border-radius: 50%;">
                <span style="font-size: 0.9rem;">
                  por <a href="/profile/${creatorPath}" data-link style="font-weight: 700;">@${creatorName}</a> 
                  <span style="color: var(--text-tertiary); font-size: 0.8rem; margin-left: 4px;" title="Reputación acumulada">${creatorRep} pts de reputación</span>
                </span>
              </div>
            </div>
            
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: var(--space-2);">
              <div style="display: flex; gap: var(--space-2); flex-wrap: wrap; justify-content: flex-end;">
                <button class="btn btn-secondary btn-sm" onclick="window.teamDetailPage.toggleMoveLanguage()" style="padding: 4px 8px;">ES / EN</button>
                <button class="btn btn-secondary btn-sm" onclick="window.teamDetailPage.copyLink()" style="padding: 4px 8px;">🔗 Copiar Enlace</button>
                <button class="btn btn-secondary btn-sm" onclick="window.teamDetailPage.exportShowdown()" style="padding: 4px 8px;">📋 Exportar Showdown</button>
                ${isOwnTeam
                  ? `<a href="/team/${team.id}/edit" data-link class="btn btn-secondary btn-sm" style="padding: 4px 8px;">✏️ Editar</a>`
                  : (isAuthenticated ? `<button id="favorite-toggle-btn" class="btn btn-secondary btn-sm" onclick="window.teamDetailPage.toggleFavorite()" style="padding: 4px 8px;">${team.isFavorited ? '★ Guardado' : '☆ Guardar'}</button>` : '')
                }
                <button class="btn btn-secondary btn-sm" onclick="window.teamDetailPage.openReportModal()" style="color: var(--danger); border-color: rgba(235, 87, 87, 0.2);">Reportar</button>
              </div>
              <div style="font-size: 0.75rem; color: var(--text-tertiary); display: flex; gap: 8px;">
                <span>${team.viewCount || 0} vistas</span>
                <span aria-hidden="true">•</span>
                <span>${new Date(team.createdAt).toLocaleDateString('es-ES')}</span>
              </div>
            </div>
          </div>

          <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; white-space: pre-wrap; margin-bottom: var(--space-4); border-top: 1px solid var(--border-subtle); padding-top: var(--space-3);">
            ${team.description ? escapeHTML(team.description) : 'El creador no ha proporcionado una descripción detallada de la estrategia competitiva.'}
          </p>

          <div style="display: flex; flex-wrap: wrap; gap: var(--space-2);">
            ${tagsHTML}
          </div>
        </div>

        <!-- Layout Doble -->
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-6);">
          <div>
            <h3 style="font-size: 1.25rem; margin-bottom: var(--space-4); border-left: 4px solid var(--accent-primary); padding-left: var(--space-2);">Alineación del Equipo</h3>
            <div style="display: flex; flex-direction: column; gap: var(--space-4);">
              ${pokemonCardsHTML}
            </div>
          </div>

          <div>
            <div id="ratings-widget-root"></div>
            
            <div class="card" style="padding: var(--space-4); text-align: center;">
              <h4 style="font-size: 0.9rem; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: var(--space-2);">Estadísticas Globales</h4>
              <div style="display: flex; justify-content: space-around; align-items: center;">
                <div>
                  <div id="avg-strength-stat" style="font-size: 2rem; font-weight: 800; color: var(--warning);">${team.avgStrength || '0.0'}</div>
                  <div style="font-size: 0.7rem; color: var(--text-tertiary); font-weight: 600;">FUERZA</div>
                </div>
                <div style="height: 40px; border-left: 1px solid var(--border-subtle);"></div>
                <div>
                  <div id="avg-originality-stat" style="font-size: 2rem; font-weight: 800; color: var(--accent-secondary);">${team.avgOriginality || '0.0'}</div>
                  <div style="font-size: 0.7rem; color: var(--text-tertiary); font-weight: 600;">ORIGINALIDAD</div>
                </div>
              </div>
              <div id="total-ratings-count" style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: var(--space-3);">${team.totalVotes || 0} valoraciones registradas</div>
            </div>
          </div>
        </div>

        <div id="comments-widget-root" class="comments-section" style="margin-top: var(--space-7);"></div>
      </div>
    `;

    starRating.render('ratings-widget-root', team.id, team.userRating);
    commentThread.render('comments-widget-root', team.id, team.comments || []);

    const submitReportBtn = document.getElementById('submit-report-btn');
    if (submitReportBtn) {
      submitReportBtn.addEventListener('click', submitReport);
    }

  } catch (err) {
    console.error('Error al inicializar detalle del equipo:', err);
    container.innerHTML = `<div class="card" style="border-color: var(--danger); text-align: center; padding: var(--space-5);"><p style="color: var(--danger);">Error al cargar los detalles del equipo: ${err.message}</p></div>`;
  }
};

window.teamDetailPage = {
  updateRatingsInfo(avgStrength, avgOriginality, totalVotes, creatorRep) {
    const strengthEl = document.getElementById('avg-strength-stat');
    const originalityEl = document.getElementById('avg-originality-stat');
    const countEl = document.getElementById('total-ratings-count');
    
    if (strengthEl) strengthEl.textContent = avgStrength.toFixed(1);
    if (originalityEl) originalityEl.textContent = avgOriginality.toFixed(1);
    if (countEl) countEl.textContent = `${totalVotes} valoraciones registradas`;

    toast.show('¡Tus valoraciones se han ponderado en la reputación global del creador!', 'success');
  },

  openReportModal() {
    const modal = document.getElementById('report-modal');
    const reasonInput = document.getElementById('report-reason');
    if (reasonInput) reasonInput.value = '';
    if (modal) modal.classList.add('active');
  },

  toggleMoveLanguage() {
    const nextLanguage = getMoveLanguage() === 'es' ? 'en' : 'es';
    setMoveLanguage(nextLanguage);
    if (currentTeamParams) {
      teamDetailPage.init(currentTeamParams);
    }
  },

  closeReportModal() {
    const modal = document.getElementById('report-modal');
    if (modal) modal.classList.remove('active');
  },

  async copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.show('Enlace copiado al portapapeles.', 'success');
    } catch (err) {
      toast.show('No se pudo copiar el enlace.', 'error');
    }
  },

  async exportShowdown() {
    if (!currentTeam) return;
    try {
      const exportText = buildShowdownExport(currentTeam);
      await navigator.clipboard.writeText(exportText);
      toast.show('Equipo copiado en formato Showdown.', 'success');
    } catch (err) {
      toast.show('No se pudo exportar el equipo.', 'error');
    }
  },

  async toggleFavorite() {
    if (!currentTeam) return;
    const btn = document.getElementById('favorite-toggle-btn');
    try {
      if (btn) btn.disabled = true;
      const res = await api.post(`/teams/${currentTeam.id}/favorite`);
      currentTeam.isFavorited = res.favorited;
      if (btn) btn.textContent = res.favorited ? '★ Guardado' : '☆ Guardar';
      toast.show(res.message, 'success');
    } catch (err) {
      toast.show(err.message || 'Error al guardar en favoritos.', 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  }
};

async function submitReport() {
  const reasonInput = document.getElementById('report-reason');
  const submitBtn = document.getElementById('submit-report-btn');

  if (!reasonInput || !reasonInput.value.trim()) {
    toast.show('Debes proporcionar una razón para reportar este contenido.', 'error');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    await api.post(`/users/report/${currentTeam.id}`, {
      reason: reasonInput.value.trim()
    });

    toast.show('El equipo ha sido reportado. El staff lo revisará en breve.', 'success');
    window.teamDetailPage.closeReportModal();
  } catch (err) {
    toast.show(err.message || 'Error al reportar equipo.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar Reporte';
  }
}

export default teamDetailPage;
