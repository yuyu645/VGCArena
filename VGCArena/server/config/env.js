// Configuración centralizada de entorno.
// En producción, arrancar sin JWT_SECRET es un fallo fatal: evita firmar
// tokens con una clave conocida y hardcodeada.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('FATAL: la variable de entorno JWT_SECRET es obligatoria en producción.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';

module.exports = { JWT_SECRET };
