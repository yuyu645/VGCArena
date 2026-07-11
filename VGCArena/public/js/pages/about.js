async function aboutPage() {
  return `
    <div style="max-width: 800px; margin: var(--space-6) auto 0; width: 100%;">
      <div class="card card-static animate-fade-in" style="padding: var(--space-6);">
        <h1 style="font-size: 2rem; margin-bottom: var(--space-3); text-align: center;">Acerca de VGC Arena</h1>
        
        <p style="font-size: 1rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: var(--space-4); text-align: center;">
          VGC Arena es una plataforma web independiente construida para los entusiastas de las batallas competitivas de Pokémon Champions (VGC).
        </p>

        <div style="border-top: 1px solid var(--border-subtle); padding-top: var(--space-4); margin-bottom: var(--space-4);">
          <h3 style="font-size: 1.25rem; margin-bottom: var(--space-2); color: var(--text-primary);">Aviso Legal y de Derechos</h3>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6;">
            Este es un proyecto <strong>completamente gratuito y sin fines de lucro</strong> creado por fanáticos de Pokémon.
            Esta plataforma <strong>no</strong> está afiliada, respaldada, patrocinada ni asociada en ninguna forma con Nintendo, Game Freak, The Pokémon Company o Creatures Inc.
          </p>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin-top: 8px;">
            Las marcas comerciales, personajes, nombres de especies, sprites, sonidos y materiales conceptuales asociados a Pokémon son propiedad exclusiva de sus respectivos dueños.
          </p>
        </div>

        <div style="border-top: 1px solid var(--border-subtle); padding-top: var(--space-4); margin-bottom: var(--space-4);">
          <h3 style="font-size: 1.25rem; margin-bottom: var(--space-2); color: var(--text-primary);">Créditos de PokéAPI</h3>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6;">
            Todos los datos técnicos de Pokémon (como especies legales, tipos elementales, habilidades, movepools y sprites) son provistos en tiempo real gracias a la excelente base de datos de 
            <a href="https://pokeapi.co" target="_blank" rel="noopener noreferrer" style="font-weight: 600; color: var(--accent-secondary);">PokéAPI</a>.
          </p>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin-top: 8px;">
            En cumplimiento de la política de "Fair Use" de PokéAPI, esta plataforma implementa una capa robusta de almacenamiento en caché en el cliente (usando memoria RAM + base de datos local IndexedDB del navegador) para persistir temporalmente la información por 7 días y evitar saturar sus servidores con peticiones redundantes.
          </p>
        </div>

        <div style="border-top: 1px solid var(--border-subtle); padding-top: var(--space-4); text-align: center;">
          <a href="/" data-link class="btn btn-primary">Volver al Feed Principal</a>
        </div>
      </div>
    </div>
  `;
}

aboutPage.init = function() {};

export default aboutPage;
