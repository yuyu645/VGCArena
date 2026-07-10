const toast = {
  show(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `toast ${type}`;
    
    let icon = '🔔';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    
    el.innerHTML = `
      <span>${icon}</span>
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
