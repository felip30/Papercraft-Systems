/**
 * MATRIX RAIN - PaperCraft Systems
 * Animación de fondo tipo "lluvia digital" con 0 y 1 en morado neón.
 * Se activa únicamente en la página que incluya <canvas id="matrixRain">.
 * No depende de ningún otro módulo del proyecto ni modifica su comportamiento.
 */

(function () {
  const canvas = document.getElementById('matrixRain');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const CHARS = '01';
  const FONT_SIZE = 16;
  const PURPLE = '#B24BF3';       // morado neón, coherente con --purpura del proyecto
  const PURPLE_BRIGHT = '#E0AFFF'; // cabeza de cada columna, más clara/brillante

  let columns = 0;
  let drops = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = Math.floor(canvas.width / FONT_SIZE);
    drops = new Array(columns).fill(0).map(() => Math.floor(Math.random() * -50));
  }

  function draw() {
    // Estela semitransparente sobre el fondo oscuro del sitio (no lo tapa,
    // solo deja un rastro que se desvanece).
    ctx.fillStyle = 'rgba(10, 14, 39, 0.12)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${FONT_SIZE}px 'Courier New', monospace`;

    for (let i = 0; i < drops.length; i++) {
      const char = CHARS[Math.floor(Math.random() * CHARS.length)];
      const x = i * FONT_SIZE;
      const y = drops[i] * FONT_SIZE;

      // El carácter en la punta de cada columna brilla más que el resto de la estela.
      ctx.fillStyle = Math.random() > 0.94 ? PURPLE_BRIGHT : PURPLE;
      ctx.shadowColor = PURPLE;
      ctx.shadowBlur = 6;
      ctx.fillText(char, x, y);
      ctx.shadowBlur = 0;

      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  let lastFrame = 0;
  const FRAME_INTERVAL = 55; // ms entre cuadros, para un caído legible y no muy veloz

  function animate(timestamp) {
    if (timestamp - lastFrame >= FRAME_INTERVAL) {
      draw();
      lastFrame = timestamp;
    }
    requestAnimationFrame(animate);
  }

  // Respeta la preferencia de "reducir movimiento" del sistema operativo.
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  resize();
  window.addEventListener('resize', resize);

  if (!prefersReducedMotion) {
    requestAnimationFrame(animate);
  } else {
    draw();
  }
})();
