// Rate limiter en memoria.
// Guarda, por IP, las marcas de tiempo de las peticiones dentro de la ventana.
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

function rateLimiter(limit = 100, windowMs = 15 * 60 * 1000, message = 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.') {
  return (req, res, next) => {
    // req.ip es fiable solo si Express confía en el proxy (ver app.set('trust proxy')).
    const ip = req.ip;
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

module.exports = { rateLimiter };
