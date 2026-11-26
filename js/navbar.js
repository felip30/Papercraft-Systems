/**
 * NAVBAR COMPARTIDO - PaperCraft Systems
 * Lo usan shop.html, cart.html y games.html. Se incluye así, justo donde
 * va el navbar:
 *
 *   <script src="js/navbar.js" data-pagina="shop" data-brand-size="20"></script>
 *
 * Muestra todos los enlaces menos el de la página actual. Los enlaces con
 * data-auth-only / data-admin-only arrancan ocultos y los muestra
 * UIManager.updateUIByRole() (js/ui.js) según la sesión; los íconos
 * (data-icon) los dibuja js/utils/icons.js, igual que antes.
 */
(function () {
  const script = document.currentScript;
  const pagina = script ? script.dataset.pagina : '';
  const brandSize = (script && script.dataset.brandSize) || '20';

  // [página, href, ícono, texto, visibilidad, onclick]
  const ENLACES = [
    ['index', 'index.html', 'home', 'Inicio', '', ''],
    ['shop', 'shop.html', 'bag', 'Tienda', '', ''],
    ['cart', 'cart.html', 'cart', 'Carrito', 'data-auth-only', ''],
    ['games', 'games.html', 'game', 'Juegos', '', ''],
    ['profile', '#', 'user', 'Mi Perfil', 'data-auth-only', 'openProfileModal(); return false;'],
    ['admin', 'admin.html', 'admin', 'Panel Admin', 'data-admin-only', '']
  ];

  // Los enlaces que dependen de la sesión arrancan ocultos.
  const oculto = (visibilidad) => (visibilidad ? `${visibilidad} style="display: none;"` : '');

  function separadorHtml(visibilidad) {
    if (!visibilidad) return '\n    <span class="nav-sep" aria-hidden="true"></span>';
    return `\n    <span class="nav-sep" ${visibilidad} aria-hidden="true" style="display: none;"></span>`;
  }

  const enlaces = ENLACES
    .filter(([id]) => id !== pagina)
    .map(([, href, icono, texto, visibilidad, onclick], i) => {
      const separador = i === 0 ? '' : separadorHtml(visibilidad);
      const click = onclick ? ` onclick="${onclick}"` : '';
      return `${separador}\n    <a href="${href}" ${oculto(visibilidad)}${click}><span data-icon="${icono}" data-icon-size="16"></span> ${texto}</a>`;
    })
    .join('');

  const html = `<nav class="navbar">
  <div class="nav-brand" onclick="location.href='index.html'"><span data-icon="store" data-icon-size="${brandSize}"></span> PaperCraft</div>
  <div class="nav-spacer"></div>
  <button type="button" class="nav-hamburger" id="navHamburger" onclick="toggleMobileNav()" aria-label="Abrir menú">
    <span></span><span></span><span></span>
  </button>
  <div class="nav-links" id="navLinks">${enlaces}
  </div>
  <div class="navbar-auth-section">
    <!-- Se completa con JavaScript -->
  </div>
</nav>`;

  if (script) {
    script.insertAdjacentHTML('beforebegin', html);
  } else {
    document.body.insertAdjacentHTML('afterbegin', html);
  }
})();
