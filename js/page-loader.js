/**
 * PANTALLA DE CARGA COMPARTIDA - PaperCraft Systems
 * Se incluye como primer elemento del <body>, de forma síncrona, para que
 * el loader (zorro + anillo) aparezca apenas arranca la página. Cada página
 * lo oculta agregando la clase "page-loader-hidden" cuando sus datos están
 * listos. Estilos en css/page-loader.css.
 */
(function () {
  const loaderHtml = [
    '<div id="pageLoader">',
    '  <div class="page-loader-ring-wrap">',
    '    <div class="page-loader-ring"></div>',
    '    <svg class="page-loader-fox" viewBox="0 0 32 28" shape-rendering="crispEdges">',
    '      <!-- cola enroscada al frente -->',
    '      <rect x="20" y="16" width="2" height="6" fill="#FF7A1A"/>',
    '      <rect x="22" y="20" width="4" height="2" fill="#FF7A1A"/>',
    '      <rect x="24" y="16" width="2" height="4" fill="#FF7A1A"/>',
    '      <!-- cuerpo sentado (más ancho abajo) -->',
    '      <rect x="8" y="14" width="14" height="8" fill="#FF9F3D"/>',
    '      <rect x="6" y="20" width="18" height="4" fill="#FF9F3D"/>',
    '      <rect x="10" y="18" width="8" height="4" fill="#FFF3E0"/>',
    '      <!-- cabeza -->',
    '      <rect x="9" y="4" width="12" height="10" fill="#FF9F3D"/>',
    '      <rect x="11" y="10" width="8" height="4" fill="#FFF3E0"/>',
    '      <!-- orejas -->',
    '      <rect x="9" y="1" width="3" height="4" fill="#FF7A1A"/>',
    '      <rect x="18" y="1" width="3" height="4" fill="#FF7A1A"/>',
    '      <!-- ojos cerrados (esperando tranquilo) -->',
    '      <rect x="12" y="8" width="2" height="1" fill="#2B1810"/>',
    '      <rect x="17" y="8" width="2" height="1" fill="#2B1810"/>',
    '      <!-- hocico -->',
    '      <rect x="14" y="11" width="2" height="2" fill="#2B1810"/>',
    '      <!-- patas delanteras -->',
    '      <rect x="9" y="21" width="2" height="3" fill="#2B1810"/>',
    '      <rect x="15" y="21" width="2" height="3" fill="#2B1810"/>',
    '    </svg>',
    '  </div>',
    '  <p class="page-loader-text">Cargando...</p>',
    '</div>'
  ].join('\n');

  const script = document.currentScript;
  if (script) {
    script.insertAdjacentHTML('beforebegin', loaderHtml);
  } else {
    document.body.insertAdjacentHTML('afterbegin', loaderHtml);
  }

  // Salvaguarda: si algo falla o tarda demasiado, el loader se oculta
  // solo a los 8 segundos, para no dejar a nadie mirando la pantalla de
  // carga para siempre.
  setTimeout(() => {
    const el = document.getElementById('pageLoader');
    if (el) el.classList.add('page-loader-hidden');
  }, 8000);
})();
