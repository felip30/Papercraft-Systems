/**
 * ICONS - PaperCraft Systems
 * Librería de iconos SVG en línea. Sustituye el uso de emojis en toda la
 * interfaz para mantener una estética profesional y consistente.
 *
 * Uso:
 *   Icons.svg('cart')                -> devuelve el string SVG
 *   Icons.svg('cart', { size: 20 })  -> con tamaño custom
 *
 * Los elementos con atributo data-icon="nombre" se resuelven automáticamente
 * al cargar la página (ver Icons.hydrate()).
 */

const ICON_PATHS = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/>',
  store: '<path d="M3 9 4 4h16l1 5"/><path d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9Z"/><path d="M9 20v-6h6v6"/>',
  cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M3 4h2l2.2 11.2A2 2 0 0 0 9.16 17H18a2 2 0 0 0 1.96-1.6L21.5 8H6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c1.2-3.4 3.8-5 6.5-5s5.3 1.6 6.5 5"/><circle cx="17" cy="9" r="2.6"/><path d="M15.5 12.3c2.1.2 3.9 1.6 4.9 4.5"/>',
  admin: '<path d="M12 3 4 6.5v5c0 4.6 3.2 8.4 8 9.5 4.8-1.1 8-4.9 8-9.5v-5L12 3Z"/><path d="m9 12 2 2 4-4.2"/>',
  logout: '<path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"/><path d="M14 16l4-4-4-4"/><path d="M18 12H8"/>',
  login: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 16l-4-4 4-4"/><path d="M6 12h11"/>',
  game: '<rect x="2.5" y="7.5" width="19" height="9" rx="4"/><path d="M7 10v4M5 12h4"/><circle cx="15.5" cy="10.5" r="1"/><circle cx="18" cy="13" r="1"/>',
  gift: '<rect x="3" y="9.5" width="18" height="11" rx="1"/><path d="M3 9.5h18v3.5H3z" fill="currentColor" opacity=".15"/><path d="M12 9.5V21"/><path d="M7.5 9.5C6 9.5 5 8.4 5 7s1-2.6 2.4-2.6C9.6 4.4 12 6.3 12 9.5"/><path d="M16.5 9.5c1.5 0 2.5-1.1 2.5-2.5S18 4.4 16.6 4.4C14.4 4.4 12 6.3 12 9.5"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 5H5a2 2 0 0 0 0 4h1.2M16 5h3a2 2 0 0 1 0 4h-1.2"/><path d="M12 13v3M9 20h6M10 20V16h4v4"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12 20 3M17 6l2.5 2.5M14 9l2 2"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="m3.5 6 8.5 6.5L20.5 6"/>',
  check: '<path d="m5 12.5 4.8 4.8L19.5 7.5"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8L16.5 9"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  warning: '<path d="M12 4 3 20h18L12 4Z"/><path d="M12 10.5v4M12 17.2v.1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.1"/>',
  refresh: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-14 5.3L4 15"/><path d="M4 20v-5h5"/>',
  edit: '<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="m14.5 7 3 3"/>',
  trash: '<path d="M5 7h14"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M7 7l1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 5.6A10.6 10.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a15.6 15.6 0 0 1-3.2 4M6.5 6.9C4 8.6 2.5 12 2.5 12s3.5 6.5 9.5 6.5a9.9 9.9 0 0 0 3.4-.6"/><path d="M9.9 10a2.9 2.9 0 0 0 4.1 4.1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m19.5 19.5-4.4-4.4"/>',
  heart: '<path d="M12 20.5S3.5 15 3.5 8.8A4.3 4.3 0 0 1 12 6.5a4.3 4.3 0 0 1 8.5 2.3C20.5 15 12 20.5 12 20.5Z"/>',
  star: '<path d="m12 3 2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 17l-5.6 3.1L7.8 13.8 3 9.5l6.4-.6L12 3Z"/>',
  starHalf: '<path d="M12 3v14l-5.6 3.1L7.8 13.8 3 9.5l6.4-.6L12 3Z"/>',
  package: '<path d="m3.5 7.5 8.5-4 8.5 4-8.5 4-8.5-4Z"/><path d="M3.5 7.5V16l8.5 4 8.5-4V7.5"/><path d="M12 11.5V20"/>',
  chart: '<path d="M4 20V10M11 20V4M18 20v-7"/><path d="M3 20h18"/>',
  card: '<rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="M3 10h18"/>',
  truck: '<rect x="2.5" y="7.5" width="11" height="9" rx="1"/><path d="M13.5 10.5H17l3 3v3h-6.5Z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>',
  bag: '<path d="M6.5 8.5h11l1 12.5h-13l1-12.5Z"/><path d="M9 8.5V6a3 3 0 0 1 6 0v2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3.2 2"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 4H19a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 0 4 22"/><path d="M4 5.5v14A2.5 2.5 0 0 0 6.5 22"/>',
  notebook: '<rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M9 3.5v17M5 7h4M5 11h4M5 15h4"/>',
  pen: '<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/>',
  palette: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 2-1 2-2 0-.5-.2-.9-.4-1.3-.2-.4-.4-.7-.4-1.1 0-.8.7-1.5 1.5-1.5H17a4 4 0 0 0 4-4c0-4-4-7-9-7Z"/><circle cx="8" cy="12" r="1"/><circle cx="9.5" cy="8" r="1"/><circle cx="14.5" cy="8" r="1"/><circle cx="16" cy="12" r="1"/>',
  drama: '<circle cx="8.5" cy="9" r="4.5"/><circle cx="15.5" cy="13" r="4.5" fill="currentColor" opacity=".08"/><path d="M6.7 8c.4-.4 1-.4 1.4 0M10.3 8c.4-.4 1-.4 1.4 0M6.8 10.2c.6.7 1.5 1.1 2.5 1.1M13.7 12.2c.4-.4 1-.4 1.4 0M17.3 12.2c.4-.4 1-.4 1.4 0M13.8 14.4c.6.7 1.5 1.1 2.5 1.1" stroke-width="1.3"/>',
  tent: '<path d="M12 3 3 19h18L12 3Z"/><path d="M12 3v16M7.5 19 12 11l4.5 8"/>',
  film: '<rect x="3" y="4.5" width="18" height="15" rx="1.5"/><path d="M8 4.5v15M16 4.5v15M3 9h5M16 9h5M3 15h5M16 15h5"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8.5" cy="8.5" r="1.2"/><circle cx="15.5" cy="8.5" r="1.2"/><circle cx="8.5" cy="15.5" r="1.2"/><circle cx="15.5" cy="15.5" r="1.2"/><circle cx="12" cy="12" r="1.2"/>',
  bowling: '<circle cx="12" cy="13" r="7.5"/><circle cx="10.5" cy="9" r=".8"/><circle cx="13" cy="9.5" r=".8"/><circle cx="11.5" cy="11" r=".8"/>',
  gamepad: '<rect x="2.5" y="7.5" width="19" height="9" rx="4"/><path d="M7 10v4M5 12h4"/><circle cx="15.5" cy="10.5" r="1"/><circle cx="18" cy="13" r="1"/>',
  chip: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><rect x="10" y="10" width="4" height="4"/><path d="M9 2v3M12 2v3M15 2v3M9 19v3M12 19v3M15 19v3M2 9h3M2 12h3M2 15h3M19 9h3M19 12h3M19 15h3"/>',
  wheel: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 3v7M12 14v7M3 12h7M14 12h7"/>',
  brain: '<path d="M9 4.5a3 3 0 0 0-3 3v.3A3 3 0 0 0 4.5 10.5a3 3 0 0 0 1 5.6A3 3 0 0 0 8.5 20a3 3 0 0 0 3-2.6V7a2.5 2.5 0 0 0-2.5-2.5Z"/><path d="M15 4.5a3 3 0 0 1 3 3v.3a3 3 0 0 1 1.5 2.7 3 3 0 0 1-1 5.6 3 3 0 0 1-3 3.9 3 3 0 0 1-3-2.6V7A2.5 2.5 0 0 1 15 4.5Z"/>',
  location: '<path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.3"/>',
  save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h8V4M8 14h8v6H8z"/>',
  document: '<path d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"/><path d="M14 3.5V8h4"/>',
  spinner: '<path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2"/>',
  bell: '<path d="M6 10.5a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14.5 6 10.5Z"/><path d="M10.3 19a1.9 1.9 0 0 0 3.4 0"/>',
  tag: '<path d="M4 4h7l9 9-7 7-9-9V4Z"/><circle cx="8" cy="8" r="1.3"/>',
  thumbsUp: '<path d="M7 11v9H4v-9h3Z"/><path d="M7 11l3.5-7a2 2 0 0 1 2 2.2L11.5 10H18a2 2 0 0 1 2 2.4l-1.3 6A2 2 0 0 1 16.8 20H7"/>',
  chat: '<path d="M4 5.5h16v11H9L4 20V5.5Z"/>',
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/>',
  whatsapp: '<path d="M12 3.5a8.3 8.3 0 0 0-7.1 12.5L3.5 20.5l4.7-1.3A8.3 8.3 0 1 0 12 3.5Z"/><path d="M8.7 8.4c.2-.5.5-.5.8-.5h.5c.2 0 .4 0 .6.4.2.5.7 1.6.7 1.7.1.2.1.3 0 .5-.1.2-.1.3-.3.4-.1.2-.3.3-.4.5-.2.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.5 1.5.2.1.4.1.5-.1.2-.2.6-.7.8-1 .2-.2.4-.2.6-.1l1.5.7c.2.1.4.2.5.3.1.2.1.9-.2 1.4-.3.6-1.4 1.2-2 1.2-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.7-3-1.3-4.9-4.3-5-4.5-.2-.2-1.2-1.6-1.2-3s.7-2.2 1-2.5Z"/>',
  facebook: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M14 8.5h-1.5a2 2 0 0 0-2 2V12H8.5v2.5H10.5V20.5h2.5V14.5H15l.5-2.5h-3v-1a.7.7 0 0 1 .7-.7H15V8.5Z" fill="currentColor" stroke="none"/>',
  tiktok: '<path d="M14 3.5v10.8a3.3 3.3 0 1 1-3.3-3.3c.3 0 .6 0 .9.1"/><path d="M14 3.5a5 5 0 0 0 5 5"/>',
  youtube: '<rect x="2.5" y="6" width="19" height="12" rx="3.5"/><path d="M10.5 9.8v4.4l4-2.2-4-2.2Z" fill="currentColor" stroke="none"/>',
  twitterX: '<path d="m4.5 4.5 15 15M19.5 4.5l-15 15"/>',
  phone: '<path d="M6 4h3l1.5 4.5-2 1.5a10 10 0 0 0 5.5 5.5l1.5-2 4.5 1.5v3a2 2 0 0 1-2 2C10.5 20 4 13.5 4 6a2 2 0 0 1 2-2Z"/>',
  link: '<path d="M9.5 14.5 14.5 9.5"/><path d="M11 6.5 12.4 5A4 4 0 1 1 18 10.6L16.5 12"/><path d="M13 17.5 11.6 19A4 4 0 1 1 6 13.4L7.5 12"/>',
};

const Icons = {
  svg(name, opts = {}) {
    const size = opts.size || 18;
    const path = ICON_PATHS[name] || ICON_PATHS.info;
    const cls = opts.className ? ` class="${opts.className}"` : '';
    return `<svg${cls} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:inline-block;vertical-align:-3px">${path}</svg>`;
  },

  // Reemplaza todos los <i data-icon="nombre"></i> presentes en el DOM.
  hydrate(root = document) {
    root.querySelectorAll('[data-icon]').forEach(el => {
      const name = el.getAttribute('data-icon');
      const size = el.getAttribute('data-icon-size') || 18;
      el.innerHTML = this.svg(name, { size });
    });
  }
};

window.Icons = Icons;
document.addEventListener('DOMContentLoaded', () => Icons.hydrate());
