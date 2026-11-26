/**
 * ZORRO DEL INICIO - PaperCraft Systems
 * El zorro que flota en la portada (index.html) pasa de estilo emoji a
 * pixel art en 5 pasos y vuelve igual, en bucle.
 *
 * - Etapa 1: el dibujo original (assets/zorro-hero.svg).
 * - Etapa 2: el mismo dibujo reducido, con los bordes ya pixelados.
 * - Etapas 3 a 6: pixel art de colores planos, pintado píxel por píxel con
 *   las mismas formas del dibujo y cada vez con menos píxeles. Ojos, nariz
 *   y boca tienen un tamaño mínimo para que no desaparezcan. *
 * Cada vez que vuelve al estilo emoji se abre en 6 clones (uno por diseño,
 * del 1 al 6, de izquierda a derecha) hasta los bordes del título, y luego
 * se vuelven a juntar en uno solo en el centro.
 */
(function () {
  const img = document.getElementById('heroFox');
  if (!img) return;

  const reducirMovimiento = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducirMovimiento) return;

  // Ancho en píxeles de cada etapa pixelada (2 a 6)
  const ANCHO_ETAPA_2 = 50;
  const ANCHOS_PIXEL_ART = [42, 30, 24, 18];

  const PASO_MS = 320;            // tiempo entre una etapa y la siguiente
  const PAUSA_EMOJI_MS = 1300;    // tiempo quieto en estilo emoji (antes y después de abrirse)
  const PAUSA_PIXEL_MS = 1200;    // tiempo quieto en pixel art
  const MOVER_MS = 900;           // lo que tardan los clones en abrirse o juntarse
  const PAUSA_ABIERTOS_MS = 2200; // tiempo que se quedan abiertos

  // Dibujo de referencia: 120 x 104 unidades (mismo viewBox del SVG)
  const ANCHO_REF = 120;
  const ALTO_REF = 104;

  const COLOR = {
    oreja: '#F58A2A',
    puntaOreja: '#3B2622',
    interiorOreja: '#E4542A',
    cabeza: '#F7901F',
    cabezaClara: '#FFA63D',
    cabezaOscura: '#EE7419',
    hocico: '#FFE7B8',
    hocicoRosa: '#F5A8A0',
    ojos: '#3B2622',
    nariz: '#2B1810'
  };

  function dentroTriangulo(x, y, a, b, c) {
    const lado = (p, q) => (x - q[0]) * (p[1] - q[1]) - (p[0] - q[0]) * (y - q[1]);
    const d1 = lado(a, b);
    const d2 = lado(b, c);
    const d3 = lado(c, a);
    const hayNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hayPos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(hayNeg && hayPos);
  }

  function dentroElipse(x, y, cx, cy, rx, ry) {
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  }

  // Lado izquierdo; el derecho se obtiene reflejando x (120 - x).
  const OREJA = [[16, 54], [31, 2], [53, 32]];
  const INTERIOR_OREJA = [[25, 46], [32, 14], [45, 34]];

  function dentroHocico(x, y) {
    const t = Math.abs(x - 60) / 56;
    if (t > 1) return false;
    const bordeSuperior = 72 - 14 * t + 10 * t * t;
    return y >= bordeSuperior && dentroElipse(x, y, 60, 68, 56, 34);
  }

  // Color del fondo del zorro (sin ojos, nariz ni boca) en un punto.
  function colorBase(x, y, sombreado) {
    if (dentroHocico(x, y)) {
      return y > 94 ? COLOR.hocicoRosa : COLOR.hocico;
    }
    if (dentroElipse(x, y, 60, 60, 42, 34)) {
      if (!sombreado) return COLOR.cabeza;
      if (y < 44) return COLOR.cabezaClara;
      return y > 76 ? COLOR.cabezaOscura : COLOR.cabeza;
    }
    const xi = x <= 60 ? x : ANCHO_REF - x; // reflejo para la oreja derecha
    if (dentroTriangulo(xi, y, ...INTERIOR_OREJA)) return COLOR.interiorOreja;
    if (dentroTriangulo(xi, y, ...OREJA)) return y < 17 ? COLOR.puntaOreja : COLOR.oreja;
    return null;
  }

  function rellenar(pix, ancho, x0, y0, w, h, color) {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        if (y >= 0 && x >= 0 && x < ancho && y < pix.length / ancho) pix[y * ancho + x] = color;
      }
    }
  }

  // Ojos, nariz y boca, con un tamaño mínimo en píxeles.
  function pintarCara(pix, ancho, u) {
    const centro = ancho / 2;
    const ojoW = Math.max(1, Math.round(6.5 / u), ancho <= 24 ? 2 : 1);
    const ojoH = Math.max(2, Math.round(11 / u));
    const ojoY = Math.round(55.5 / u - ojoH / 2);
    const separacion = Math.round(14.75 / u); // distancia del centro a cada ojo
    rellenar(pix, ancho, Math.round(centro - separacion - ojoW / 2), ojoY, ojoW, ojoH, COLOR.ojos);
    rellenar(pix, ancho, Math.round(centro + separacion - ojoW / 2), ojoY, ojoW, ojoH, COLOR.ojos);

    const narizW = Math.max(2, Math.round(14 / u));
    const narizH = Math.max(1, Math.round(8 / u));
    const narizY = Math.round(74 / u - narizH / 2);
    rellenar(pix, ancho, Math.round(centro - narizW / 2), narizY, narizW, narizH, COLOR.nariz);

    // boca en forma de "w": un trazo vertical y dos puntos a los lados
    const bocaY = narizY + narizH;
    const ladoBoca = Math.max(1, Math.round(6 / u));
    rellenar(pix, ancho, Math.round(centro - 1), bocaY, 2, 1, COLOR.nariz);
    rellenar(pix, ancho, Math.round(centro - 1 - ladoBoca), bocaY + 1, 1, 1, COLOR.nariz);
    rellenar(pix, ancho, Math.round(centro + ladoBoca), bocaY + 1, 1, 1, COLOR.nariz);
  }

  function lienzo(ancho, alto) {
    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    return canvas;
  }

  function pixelArt(ancho, sombreado) {
    const alto = Math.round(ancho * ALTO_REF / ANCHO_REF);
    const u = ANCHO_REF / ancho; // unidades del dibujo por píxel
    const pix = new Array(ancho * alto).fill(null);
    for (let y = 0; y < alto; y++) {
      for (let x = 0; x < ancho; x++) {
        pix[y * ancho + x] = colorBase((x + 0.5) * u, (y + 0.5) * u, sombreado);
      }
    }
    pintarCara(pix, ancho, u);

    const canvas = lienzo(ancho, alto);
    const ctx = canvas.getContext('2d');
    pix.forEach((color, i) => {
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(i % ancho, Math.floor(i / ancho), 1, 1);
    });
    return canvas.toDataURL('image/png');
  }

  function dibujoReducido(original, ancho) {
    const alto = Math.round(ancho * original.naturalHeight / original.naturalWidth);
    const canvas = lienzo(ancho, alto);
    canvas.getContext('2d').drawImage(original, 0, 0, ancho, alto);
    return canvas.toDataURL('image/png');
  }

  // Ancho real del texto "PAPERCRAFT SYSTEMS" (no el de su caja), que es
  // hasta donde se abren los clones.
  function anchoTitulo() {
    const titulo = document.querySelector('.hero h1');
    if (!titulo) return img.offsetWidth * 6;
    const rango = document.createRange();
    rango.selectNodeContents(titulo);
    return rango.getBoundingClientRect().width;
  }

  // Un clon por diseño (1 a 6), apilados detrás del zorro principal. El
  // emoji queda encima para que al juntarse no se note el cambio.
  function crearClones(fuentes) {
    const contenedor = img.parentElement;
    contenedor.classList.add('hero-fox-grupo');
    return fuentes.map((src, i) => {
      const clon = document.createElement('img');
      clon.src = src;
      clon.alt = '';
      clon.setAttribute('aria-hidden', 'true');
      clon.className = 'hero-fox hero-fox-clon' + (i > 0 ? ' hero-fox-pixel' : '');
      clon.style.zIndex = String(fuentes.length - i);
      contenedor.appendChild(clon);
      return clon;
    });
  }

  // Se abren de izquierda a derecha hasta los bordes del título, se quedan
  // un momento y se vuelven a juntar en el centro.
  function desplegar(clones, alTerminar) {
    const total = clones.length;
    const anchoZorro = img.offsetWidth;
    const ancho = anchoTitulo();
    const escala = Math.min(1, ancho / (total * anchoZorro));
    const anchoClon = anchoZorro * escala;
    const separacion = (ancho - anchoClon) / (total - 1);

    clones.forEach(clon => {
      clon.style.top = img.offsetTop + 'px';
      clon.style.setProperty('--dx', '0px');
      clon.style.setProperty('--escala', '1');
      clon.classList.add('hero-fox-clon-visible');
    });
    img.style.visibility = 'hidden';

    // doble requestAnimationFrame: primero se pintan en el centro y luego
    // arranca la transición hacia su posición
    requestAnimationFrame(() => requestAnimationFrame(() => {
      clones.forEach((clon, i) => {
        clon.style.setProperty('--dx', (i * separacion - (ancho - anchoClon) / 2) + 'px');
        clon.style.setProperty('--escala', String(escala));
      });
    }));

    setTimeout(() => {
      clones.forEach(clon => {
        clon.style.setProperty('--dx', '0px');
        clon.style.setProperty('--escala', '1');
      });
      setTimeout(() => {
        img.style.visibility = '';
        clones.forEach(clon => clon.classList.remove('hero-fox-clon-visible'));
        alTerminar();
      }, MOVER_MS);
    }, MOVER_MS + PAUSA_ABIERTOS_MS);
  }

  function iniciar(original) {
    const fuentes = [
      img.src,
      dibujoReducido(original, ANCHO_ETAPA_2),
      ...ANCHOS_PIXEL_ART.map((ancho, i) => pixelArt(ancho, i === 0))
    ];
    const clones = crearClones(fuentes);
    // emoji -> pixel en 5 pasos, y pixel -> emoji en otros 5
    const ida = [...fuentes.keys()];
    const secuencia = [...ida, ...ida.slice(1, -1).reverse()];
    let posicion = 0;

    function mostrar() {
      const etapa = secuencia[posicion];
      img.src = fuentes[etapa];
      img.classList.toggle('hero-fox-pixel', etapa > 0);
      posicion = (posicion + 1) % secuencia.length;

      if (etapa === 0) {
        // en estilo emoji: espera, se abre en 6 clones, se junta y sigue
        setTimeout(() => desplegar(clones, () => setTimeout(mostrar, PAUSA_EMOJI_MS)), PAUSA_EMOJI_MS);
        return;
      }
      const espera = etapa === fuentes.length - 1 ? PAUSA_PIXEL_MS : PASO_MS;
      setTimeout(mostrar, espera);
    }
    mostrar();
  }

  const original = new Image();
  original.onload = () => {
    try {
      iniciar(original);
    } catch (e) {
      // Si el navegador no permite leer el dibujo (p. ej. abriendo el
      // archivo sin servidor), el zorro se queda en su versión emoji.
      console.warn('No se pudo animar el zorro del inicio:', e.message);
    }
  };
  original.src = img.src;
})();
