// Rate limiter en memoria.
// Guarda, por IP, las marcas de tiempo de las peticiones dentro de la ventana.
// Limitación conocida: el estado vive en el proceso (Map local), así que si la app
// se despliega en varias instancias/workers cada una llevará su propio contador y
// el límite efectivo se multiplicará por el número de instancias. Para ese escenario
// haría falta un store compartido (p.ej. Redis) en vez de este Map.
const rateLimitMap = new Map();

// Barrido periódico: sin esto el Map crece sin límite porque las IPs que
// dejan de pedir nunca se eliminaban (fuga de memoria).
const SWEEP_EVERY_MS = 10 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of rateLimitMap) {
    const alive = times.filter(t => now - t < SWEEP_EVERY_MS);
    if (alive.length === 0) rateLimitMap.delete(ip);
    else rateLimitMap.set(ip, alive);
  }
}, SWEEP_EVERY_MS).unref();

// Cada instancia de rateLimiter lleva su propio contador por IP. Si todas
// compartieran la misma clave (solo la IP), las peticiones globales
// (estáticos, API) consumirían el cupo del limiter de login y bloquearían
// el inicio de sesión tras un par de páginas navegadas.
let limiterInstanceCounter = 0;

function rateLimiter(limit = 100, windowMs = 15 * 60 * 1000, message = 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.') {
  const instanceId = ++limiterInstanceCounter;
  return (req, res, next) => {
    // req.ip es fiable solo si Express confía en el proxy (ver app.set('trust proxy')).
    const ip = `${instanceId}:${req.ip}`;
    const now = Date.now();

    const requestTimes = rateLimitMap.get(ip) || [];
    const validTimes = requestTimes.filter(time => now - time < windowMs);
    validTimes.push(now);
    rateLimitMap.set(ip, validTimes);

    if (validTimes.length > limit) {
      return res.status(429).json({ error: message });
    }
    next();
  };
}

// Cabeceras de seguridad básicas (sin depender de helmet).
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  next();
}

module.exports = { rateLimiter, securityHeaders };
