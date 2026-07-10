import api from '../api.js';
import toast from './toast.js';

const starRating = {
  render(containerId, teamId, userRating = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const initialStrength = userRating ? userRating.strength : 0;
    const initialOriginality = userRating ? userRating.originality : 0;

    container.innerHTML = `
      <div class="card" style="padding: var(--space-4); margin-bottom: var(--space-5);">
        <h3 style="font-size: 1.15rem; margin-bottom: var(--space-3); border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-2);">Valorar este equipo</h3>
        
        <!-- Eje 1: Fuerza Competitiva -->
        <div style="margin-bottom: var(--space-4);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-1);">
            <span style="font-weight: 600; font-size: 0.9rem;">⚔️ Fuerza Competitiva</span>
            <span id="strength-score-label" style="font-weight: 700; color: var(--warning);">${initialStrength > 0 ? `${initialStrength}/5` : 'Sin votar'}</span>
          </div>
          <div class="stars-row" id="stars-strength" style="display: flex; gap: var(--space-2); font-size: 1.65rem; cursor: pointer;">
            ${[1, 2, 3, 4, 5].map(val => `
              <span class="star" data-value="${val}" style="color: ${val <= initialStrength ? 'var(--warning)' : 'var(--text-tertiary)'}; transition: transform 0.15s ease;">★</span>
            `).join('')}
          </div>
        </div>

        <!-- Eje 2: Originalidad -->
        <div style="margin-bottom: var(--space-4);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-1);">
            <span style="font-weight: 600; font-size: 0.9rem;">✨ Originalidad del Meta</span>
            <span id="originality-score-label" style="font-weight: 700; color: var(--accent-secondary);">${initialOriginality > 0 ? `${initialOriginality}/5` : 'Sin votar'}</span>
          </div>
          <div class="stars-row" id="stars-originality" style="display: flex; gap: var(--space-2); font-size: 1.65rem; cursor: pointer;">
            ${[1, 2, 3, 4, 5].map(val => `
              <span class="star" data-value="${val}" style="color: ${val <= initialOriginality ? 'var(--accent-secondary)' : 'var(--text-tertiary)'}; transition: transform 0.15s ease;">★</span>
            `).join('')}
          </div>
        </div>

        <button id="submit-rating-btn" class="btn btn-primary w-full" style="margin-top: var(--space-2);" disabled>
          Enviar Valoración
        </button>
      </div>
    `;

    let selectedStrength = initialStrength;
    let selectedOriginality = initialOriginality;

    // Configurar hover y click para Fuerza
    const strengthStars = container.querySelectorAll('#stars-strength .star');
    strengthStars.forEach(star => {
      star.addEventListener('mouseenter', function() {
        const val = Number(this.getAttribute('data-value'));
        highlightStars(strengthStars, val, 'var(--warning)');
      });

      star.addEventListener('mouseleave', function() {
        highlightStars(strengthStars, selectedStrength, 'var(--warning)');
      });

      star.addEventListener('click', function() {
        selectedStrength = Number(this.getAttribute('data-value'));
        document.getElementById('strength-score-label').textContent = `${selectedStrength}/5`;
        highlightStars(strengthStars, selectedStrength, 'var(--warning)');
        checkChanges();
      });
    });

    // Configurar hover y click para Originalidad
    const originalityStars = container.querySelectorAll('#stars-originality .star');
    originalityStars.forEach(star => {
      star.addEventListener('mouseenter', function() {
        const val = Number(this.getAttribute('data-value'));
        highlightStars(originalityStars, val, 'var(--accent-secondary)');
      });

      star.addEventListener('mouseleave', function() {
        highlightStars(originalityStars, selectedOriginality, 'var(--accent-secondary)');
      });

      star.addEventListener('click', function() {
        selectedOriginality = Number(this.getAttribute('data-value'));
        document.getElementById('originality-score-label').textContent = `${selectedOriginality}/5`;
        highlightStars(originalityStars, selectedOriginality, 'var(--accent-secondary)');
        checkChanges();
      });
    });

    const submitBtn = document.getElementById('submit-rating-btn');

    function highlightStars(starsList, count, color) {
      starsList.forEach(s => {
        const val = Number(s.getAttribute('data-value'));
        s.style.color = val <= count ? color : 'var(--text-tertiary)';
        if (val === count) {
          s.style.transform = 'scale(1.25)';
        } else {
          s.style.transform = 'scale(1)';
        }
      });
    }

    function checkChanges() {
      if (selectedStrength > 0 && selectedOriginality > 0) {
        if (selectedStrength !== initialStrength || selectedOriginality !== initialOriginality) {
          submitBtn.disabled = false;
        } else {
          submitBtn.disabled = true;
        }
      }
    }

    submitBtn.addEventListener('click', async () => {
      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
        
        const response = await api.post(`/teams/${teamId}/rate`, {
          strength: selectedStrength,
          originality: selectedOriginality
        });

        toast.show('¡Valoración registrada con éxito!', 'success');
        
        // Actualizar UI del detalle del equipo
        if (window.teamDetailPage && window.teamDetailPage.updateRatingsInfo) {
          window.teamDetailPage.updateRatingsInfo(response.avgStrength, response.avgOriginality, response.totalVotes, response.creatorReputation);
        }

        // Refrescar estado inicial local
        starRating.render(containerId, teamId, { strength: selectedStrength, originality: selectedOriginality });
      } catch (err) {
        toast.show(err.message || 'Error al calificar.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar Valoración';
      }
    });
  }
};

export default starRating;
