const toast = {
  show(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `toast ${type}`;
    
    let icon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--info)" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16.5v.01"/></svg>';
    if (type === 'success') icon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>';
    if (type === 'error') icon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>';

    el.innerHTML = `
      <span style="display: inline-flex; flex-shrink: 0;">${icon}</span>
      <span>${message}</span>
    `;

    container.appendChild(el);

    // Fade out y remover
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      el.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        el.remove();
      }, 300);
    }, duration);
  }
};

export default toast;
