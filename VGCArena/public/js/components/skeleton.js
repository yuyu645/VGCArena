const skeleton = {
  // Skeleton loader para el grid de equipos
  feed(count = 6) {
    let cards = '';
    for (let i = 0; i < count; i++) {
      cards += `
        <div class="card" style="display: flex; flex-direction: column; gap: var(--space-3); height: 350px;">
          <div class="skeleton" style="height: 120px; border-radius: var(--radius-md);"></div>
          <div class="skeleton" style="height: 20px; width: 60%; margin-top: 10px;"></div>
          <div class="skeleton" style="height: 32px; width: 90%;"></div>
          <div class="skeleton" style="height: 48px; width: 100%;"></div>
          <div style="margin-top: auto; display: flex; justify-content: space-between;">
            <div class="skeleton" style="height: 20px; width: 40%;"></div>
            <div class="skeleton" style="height: 20px; width: 20%;"></div>
          </div>
        </div>
      `;
    }
    return `<div class="teams-grid">${cards}</div>`;
  },

  // Skeleton loader para el detalle de un equipo
  detail() {
    return `
      <div>
        <div class="team-details-header">
          <div class="skeleton" style="height: 40px; width: 50%; margin-bottom: var(--space-3);"></div>
          <div class="skeleton" style="height: 20px; width: 30%; margin-bottom: var(--space-4);"></div>
          <div class="skeleton" style="height: 80px; width: 100%;"></div>
        </div>
        
        <div class="pokemon-details-row">
          ${Array(6).fill().map(() => `
            <div class="card" style="display: flex; gap: var(--space-4); height: 180px;">
              <div class="skeleton" style="width: 96px; height: 96px; border-radius: var(--radius-md);"></div>
              <div style="flex: 1; display: flex; flex-direction: column; gap: var(--space-2);">
                <div class="skeleton" style="height: 24px; width: 50%;"></div>
                <div class="skeleton" style="height: 20px; width: 30%;"></div>
                <div class="skeleton" style="height: 20px; width: 80%;"></div>
                <div class="skeleton" style="height: 20px; width: 70%;"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
};

export default skeleton;
