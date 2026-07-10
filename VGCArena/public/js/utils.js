// Utilidades compartidas de renderizado.

// Escapa datos de usuario antes de interpolarlos en innerHTML.
// El backend ya NO escapa en la entrada (guarda el texto tal cual), así que
// escapar aquí, en la salida, es lo que evita el XSS.
export function escapeHTML(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Solo permite avatares servidos por https:. Cualquier otra cosa
// (javascript:, data:, http:) cae al avatar por defecto.
export function safeAvatar(url, fallback = 'https://api.dicebear.com/7.x/bottts/svg') {
  if (typeof url === 'string' && /^https:\/\//i.test(url.trim())) {
    return url.trim();
  }
  return fallback;
}

// Codifica un segmento para usarlo dentro de una URL (href /profile/:username).
export function encodePath(value) {
  return encodeURIComponent(String(value ?? ''));
}
