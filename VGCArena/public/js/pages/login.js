import auth from '../auth.js';
import toast from '../components/toast.js';
import { navigateTo } from '../app.js';

async function loginPage() {
  return `
    <div style="max-width: 420px; margin: var(--space-8) auto 0; width: 100%;">
      <div class="card animate-fade-in" style="padding: var(--space-6);">
        <h2 style="font-size: 1.6rem; text-align: center; margin-bottom: var(--space-1);"><span class="text-gradient">Bienvenido de Vuelta</span></h2>
        <p style="color: var(--text-tertiary); font-size: 0.85rem; text-align: center; margin-bottom: var(--space-5);">Ingresa tus credenciales para acceder a VGC Arena</p>
        
        <form id="login-form" onsubmit="event.preventDefault();">
          <div class="form-group">
            <label class="form-label" for="login-username">Nombre de Entrenador (Usuario)</label>
            <input type="text" id="login-username" class="form-input" placeholder="Ej. RedVGC" required autocomplete="username">
          </div>

          <div class="form-group" style="margin-bottom: var(--space-5);">
            <label class="form-label" for="login-password">Contraseña</label>
            <input type="password" id="login-password" class="form-input" placeholder="••••••••" required autocomplete="current-password">
          </div>

          <button type="submit" id="login-submit-btn" class="btn btn-primary w-full" style="font-size: 1rem;">
            Ingresar
          </button>
        </form>

        <p style="font-size: 0.85rem; text-align: center; margin-top: var(--space-4); color: var(--text-secondary);">
          ¿No tienes cuenta? <a href="/register" data-link style="font-weight: 600;">Regístrate aquí</a>
        </p>
      </div>
    </div>
  `;
}

loginPage.init = function() {
  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', async () => {
      const usernameInput = document.getElementById('login-username');
      const passwordInput = document.getElementById('login-password');
      const submitBtn = document.getElementById('login-submit-btn');

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verificando...';

        await auth.login(usernameInput.value.trim(), passwordInput.value);
        
        toast.show('¡Sesión iniciada correctamente!', 'success');
        navigateTo('/');
      } catch (err) {
        toast.show(err.message || 'Error al iniciar sesión. Verifica tus datos.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Ingresar';
      }
    });
  }
};

export default loginPage;
