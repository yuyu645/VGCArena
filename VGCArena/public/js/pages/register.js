import auth from '../auth.js';
import toast from '../components/toast.js';
import { navigateTo } from '../app.js';

async function registerPage() {
  return `
    <div class="auth-wrapper auth-wrapper-wide">
      <div class="card card-static auth-card animate-fade-in">
        <div class="auth-header">
          <h2>Crea tu cuenta</h2>
          <p>Únete a la mayor red competitiva de Pokémon Champions</p>
        </div>

        <form id="register-form" onsubmit="event.preventDefault();">
          <div class="form-group">
            <label class="form-label" for="reg-username">Nombre de Entrenador (Usuario)</label>
            <input type="text" id="reg-username" class="form-input" placeholder="Ej. CynthiaVGC" required minlength="3" autocomplete="username">
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-email">Correo Electrónico</label>
            <input type="email" id="reg-email" class="form-input" placeholder="entrenador@ejemplo.com" required autocomplete="email">
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-password">Contraseña</label>
            <input type="password" id="reg-password" class="form-input" placeholder="Mínimo 6 caracteres" required minlength="6" autocomplete="new-password">
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-bio">Biografía Corta (Opcional)</label>
            <textarea id="reg-bio" class="form-input" rows="2" placeholder="Me gusta el VGC. Mi arquetipo favorito es Trick Room..."></textarea>
          </div>

          <button type="submit" id="reg-submit-btn" class="btn btn-primary w-full" style="font-size: 1rem; margin-top: var(--space-2);">
            Crear Cuenta de Entrenador
          </button>
        </form>

        <p class="auth-footer">
          ¿Ya tienes cuenta? <a href="/login" data-link>Ingresa aquí</a>
        </p>
      </div>
    </div>
  `;
}

registerPage.init = function() {
  const form = document.getElementById('register-form');
  if (form) {
    form.addEventListener('submit', async () => {
      const usernameInput = document.getElementById('reg-username');
      const emailInput = document.getElementById('reg-email');
      const passwordInput = document.getElementById('reg-password');
      const bioInput = document.getElementById('reg-bio');
      const submitBtn = document.getElementById('reg-submit-btn');

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registrando...';

        await auth.register(
          usernameInput.value.trim(),
          emailInput.value.trim(),
          passwordInput.value,
          bioInput.value.trim()
        );
        
        toast.show('¡Registro exitoso! Tu cuenta ha sido creada.', 'success');
        navigateTo('/');
      } catch (err) {
        toast.show(err.message || 'Error al registrarse. Nombre o email en uso.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Crear Cuenta de Entrenador';
      }
    });
  }
};

export default registerPage;
