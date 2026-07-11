// Crea (o promueve) la cuenta de administrador de VGC Arena.
//
// Uso:
//   node scripts/create-admin.js <usuario> <email> <contraseña>
//   npm run create-admin -- <usuario> <email> <contraseña>
//
// También acepta variables de entorno: ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD.
// Es idempotente: si el usuario ya existe, lo promueve a admin y (si se pasa
// contraseña) la actualiza. Nunca crea duplicados.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../server/config/database');

const username = process.argv[2] || process.env.ADMIN_USERNAME;
const email = process.argv[3] || process.env.ADMIN_EMAIL;
const password = process.argv[4] || process.env.ADMIN_PASSWORD;

if (!username || !email) {
  console.error('Uso: node scripts/create-admin.js <usuario> <email> <contraseña>');
  process.exit(1);
}

if (password && password.length < 8) {
  console.error('La contraseña debe tener al menos 8 caracteres.');
  process.exit(1);
}

async function main() {
  const existing = await db.findOne('users', { username });

  if (existing) {
    const changes = { role: 'admin' };
    if (password) {
      changes.passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    }
    await db.update('users', { id: existing.id }, changes);
    console.log(`Usuario "${username}" promovido a admin${password ? ' y contraseña actualizada' : ''}.`);
  } else {
    if (!password) {
      console.error('Para crear una cuenta nueva debes indicar una contraseña.');
      process.exit(1);
    }
    if (await db.findOne('users', { email })) {
      console.error(`El email "${email}" ya está registrado con otro usuario.`);
      process.exit(1);
    }
    await db.insert('users', {
      username,
      email,
      passwordHash: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
      role: 'admin',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
      bio: 'Cuenta de administración de VGC Arena. Modera reportes y mantiene la comunidad segura.',
      reputation: 0
    });
    console.log(`Cuenta de administrador "${username}" creada correctamente.`);
  }

  console.log('Puede iniciar sesión desde /login y acceder al Panel de Staff en /staff.');
  process.exit(0);
}

main().catch(err => {
  console.error('Error al crear/promover la cuenta de administrador:', err);
  process.exit(1);
});
