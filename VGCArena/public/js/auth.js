import api from './api.js';

let currentUser = null;

const auth = {
  // Inicializar estado leyendo de localStorage
  async init() {
    const token = localStorage.getItem('vgc_token');
    const userStr = localStorage.getItem('vgc_user');
    
    if (token && userStr) {
      try {
        currentUser = JSON.parse(userStr);
      } catch (e) {
        // Datos corruptos en localStorage: limpiar y seguir como invitado.
        this.logout();
        return;
      }

      // Validar token contra el servidor en segundo plano
      try {
        const freshUser = await api.get('/auth/me');
        currentUser = freshUser;
        localStorage.setItem('vgc_user', JSON.stringify(freshUser));
      } catch (err) {
        // Token expirado o inválido -> limpiar sesión
        this.logout();
      }
    }
  },

  // Iniciar sesión
  async login(username, password) {
    const data = await api.post('/auth/login', { username, password });
    localStorage.setItem('vgc_token', data.token);
    localStorage.setItem('vgc_user', JSON.stringify(data.user));
    currentUser = data.user;
    return data.user;
  },

  // Registrar usuario
  async register(username, email, password, bio, avatar) {
    const data = await api.post('/auth/register', { username, email, password, bio, avatar });
    localStorage.setItem('vgc_token', data.token);
    localStorage.setItem('vgc_user', JSON.stringify(data.user));
    currentUser = data.user;
    return data.user;
  },

  // Cerrar sesión
  logout() {
    localStorage.removeItem('vgc_token');
    localStorage.removeItem('vgc_user');
    currentUser = null;
    // Disparar evento personalizado para actualizar UI de forma reactiva
    window.dispatchEvent(new Event('auth-change'));
  },

  // Getters
  getUser() {
    return currentUser;
  },

  isAuthenticated() {
    return currentUser !== null;
  }
};

export default auth;
