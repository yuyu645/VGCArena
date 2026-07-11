import api from '../api.js';
import toast from '../components/toast.js';

async function staffPage() {
  return `
    <div>
      <div style="margin-bottom: var(--space-5);">
        <h1 style="font-size: 1.85rem;">Panel de Staff / Moderación</h1>
        <p style="color: var(--text-secondary); font-size: 0.95rem; margin-top: 4px;">Monitorea reportes de la comunidad, audita equipos compartidos y mantén el ecosistema competitivo limpio y saludable.</p>
      </div>

      <div class="card" style="padding: var(--space-5);">
        <h3 style="font-size: 1.25rem; margin-bottom: var(--space-4); display: flex; align-items: center; gap: 8px;">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.8-3.2 8-7 10-3.8-2-7-5.2-7-10V6z"/></svg> Reportes Pendientes
        </h3>
        
        <div id="reports-list-container">
          <div class="skeleton" style="height: 150px; border-radius: var(--radius-md);"></div>
        </div>
      </div>
    </div>
  `;
}

staffPage.init = async function() {
  await loadReports();
};

async function loadReports() {
  const container = document.getElementById('reports-list-container');
  if (!container) return;

  try {
    const reports = await api.get('/staff/reports');
    
    // Filtrar los que no están resueltos
    const pendingReports = reports.filter(r => r.status === 'pending');

    if (pendingReports.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: var(--space-6); color: var(--text-tertiary);">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>
          <h4 style="margin-top: var(--space-2); color: var(--text-secondary);">Todo en orden. No hay reportes pendientes de revisión.</h4>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--space-3);">
        ${pendingReports.map(rep => {
          const reportDate = new Date(rep.createdAt).toLocaleDateString('es-ES', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
          });

          return `
            <div class="card" style="background-color: var(--bg-elevated); padding: var(--space-3) var(--space-4); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-3); border-color: rgba(235, 87, 87, 0.15);">
              <div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: var(--space-1);">
                  <span class="tag-badge" style="background-color: var(--danger); color: #fff; border: none; font-size: 0.65rem;">REPORTE</span>
                  <span style="font-size: 0.8rem; color: var(--text-tertiary);">${reportDate}</span>
                </div>
                <h4 style="font-size: 1.05rem; margin-bottom: 2px;">
                  Equipo: <a href="/team/${rep.teamId}" data-link style="font-weight: 700; color: var(--text-primary);">${rep.teamName}</a>
                </h4>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 4px;">
                  Autor del equipo: <a href="/profile/${rep.teamCreatorName}" data-link style="font-weight: 600;">@${rep.teamCreatorName}</a>
                </p>
                <p style="font-size: 0.9rem; color: var(--warning); font-style: italic; background-color: var(--bg-void); padding: 6px 12px; border-radius: var(--radius-sm); border-left: 3px solid var(--warning); margin-top: var(--space-2);">
                  "<strong>Razón:</strong> ${rep.reason}"
                </p>
                <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 4px;">
                  Reportado por: @${rep.reporterName}
                </p>
              </div>
              <div style="display: flex; gap: var(--space-2);">
                <button class="btn btn-secondary btn-sm" onclick="window.staffPage.resolveReport('${rep.id}', 'dismissed')">Ignorar</button>
                <button class="btn btn-danger btn-sm" onclick="window.staffPage.removeTeam('${rep.teamId}', '${rep.id}')">Eliminar Equipo</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div style="color: var(--danger); text-align: center;">Error al cargar reportes: ${err.message}</div>`;
  }
}

// Exponer callbacks para clicks de los botones en la lista
window.staffPage = {
  async resolveReport(reportId, status) {
    try {
      await api.post(`/staff/reports/${reportId}/resolve`, { status });
      toast.show('Reporte resuelto correctamente.', 'success');
      await loadReports();
    } catch (err) {
      toast.show(err.message || 'Error al resolver reporte.', 'error');
    }
  },

  async removeTeam(teamId, reportId) {
    if (!confirm('¿Estás seguro de que deseas ELIMINAR permanentemente este equipo de la plataforma? Esta acción no se puede deshacer.')) return;

    try {
      await api.delete(`/staff/teams/${teamId}`);
      toast.show('Equipo eliminado permanentemente de la plataforma.', 'success');
      await loadReports();
    } catch (err) {
      toast.show(err.message || 'Error al eliminar el equipo.', 'error');
    }
  }
};

export default staffPage;
