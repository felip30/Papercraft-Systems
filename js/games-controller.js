/**
 * GAMES CONTROLLER - PaperCraft Systems
 * Lógica de la Zona de Juegos: Ruleta de Descuentos y Juego de Memoria.
 *
 * Correcciones aplicadas sobre la versión anterior:
 * 1. Juego de Memoria: el estado "volteada" (flipped) y "emparejada" (matched)
 *    ahora se manejan por separado. Antes, una pareja encontrada se quedaba
 *    marcada como "flipped=true" para siempre, y el contador de cartas
 *    volteadas nunca volvía a bajar de 2, bloqueando cualquier nuevo intento
 *    (el juego se "congelaba" después del primer acierto).
 * 2. Ruleta de Descuentos: se limita a un número fijo de giros por día por
 *    usuario (persistido en localStorage) y el premio ganado ahora se
 *    registra como un descuento real y utilizable a través de
 *    DataManager.addUserDiscount(), visible en "Mis Descuentos" y aplicable
 *    en el carrito de compras.
 */

const RULETA_SEGMENTOS = [
  { premio: 50 }, // 0°   - 60°  (centro 30°)
  { premio: 20 }, // 60°  - 120° (centro 90°)
  { premio: 15 }, // 120° - 180° (centro 150°)
  { premio: 10 }, // 180° - 240° (centro 210°)
  { premio: 30 }, // 240° - 300° (centro 270°)
  { premio: 5 }   // 300° - 360° (centro 330°)
];

const MAX_GIROS_POR_DIA = 3;
const MAX_MEMORIA_POR_DIA = 5;
const MAX_TRIVIA_POR_DIA = 3;
const MAX_DADO_POR_DIA = 5;
const MEMORY_ICON_KEYS = ['palette', 'drama', 'tent', 'film', 'target', 'dice', 'bowling', 'gamepad'];

const TRIVIA_PREGUNTAS = [
  { pregunta: '¿Cuál es el metal más abundante en la corteza terrestre?', opciones: ['Hierro', 'Aluminio', 'Cobre', 'Oro'], correcta: 1 },
  { pregunta: '¿Cuántos huesos tiene el cuerpo humano adulto?', opciones: ['186', '206', '226', '246'], correcta: 1 },
  { pregunta: '¿Cuál es el océano más grande del mundo?', opciones: ['Atlántico', 'Índico', 'Pacífico', 'Ártico'], correcta: 2 },
  { pregunta: '¿En qué año llegó el ser humano a la Luna por primera vez?', opciones: ['1965', '1969', '1972', '1980'], correcta: 1 },
  { pregunta: '¿Cuál es el idioma con más hablantes nativos en el mundo?', opciones: ['Inglés', 'Español', 'Chino mandarín', 'Hindi'], correcta: 2 }
];

const GamesController = {
  ruletaRotationAcumulada: 0,

  memoria: {
    intentos: 0,
    aciertos: 0,
    timerInterval: null,
    startTime: null,
    segundos: 0,
    lockBoard: false // evita clics mientras se resuelve un intento
  },

  trivia: {
    preguntaActual: 0,
    correctas: 0,
    respondida: false
  },

  init() {
    this.actualizarBannerVeto();
    this.renderMisPuntajes();
    this.renderMisDescuentos();
    this.actualizarContadorGiros();
    this.actualizarContadorMemoria();
    this.actualizarContadorTrivia();
    this.actualizarContadorDado();

    // si inicia sesión sin estar logueado, retoma el juego que quería abrir
    window.addEventListener('userLoggedIn', async () => {
      // espera a que carguen los datos de la cuenta antes de mostrar nada
      await Promise.all([
        window.DataManager.loadGameScoresFromSupabase(),
        window.DataManager.loadDiscountsFromSupabase()
      ]);

      this.actualizarBannerVeto();
      this.renderMisPuntajes();
      this.renderMisDescuentos();
      this.actualizarContadorGiros();
      this.actualizarContadorMemoria();
      this.actualizarContadorTrivia();
      this.actualizarContadorDado();

      if (this.pendingGame === 'ruleta') {
        this.pendingGame = null;
        this.playRuleta();
      } else if (this.pendingGame === 'memoria') {
        this.pendingGame = null;
        this.playMemoria();
      } else if (this.pendingGame === 'trivia') {
        this.pendingGame = null;
        this.playTrivia();
      } else if (this.pendingGame === 'dado') {
        this.pendingGame = null;
        this.playDado();
      }
    });
  },

  pendingGame: null,

  actualizarBannerVeto() {
    const auth = window.AuthManager;
    const banner = document.getElementById('vetoJuegosBanner');
    if (!banner) return;
    if (auth.isAuthenticated && auth.isBanned()) {
      document.getElementById('vetoJuegosMensaje').textContent = auth.getBanMessage();
      banner.style.display = 'block';
    } else {
      banner.style.display = 'none';
    }
  },

  requireAuth(gameName = null) {
    const auth = window.AuthManager;
    if (!auth.isAuthenticated) {
      this.pendingGame = gameName;
      window.UIManager.toast('Inicia sesión para poder jugar', 'warning');
      openLoginModal();
      return false;
    }
    if (auth.isBanned()) {
      window.UIManager.toast(auth.getBanMessage(), 'error');
      return false;
    }
    return true;
  },

  // ==================== HISTORIAL ====================

  renderMisPuntajes() {
    const auth = window.AuthManager;
    const section = document.getElementById('misPuntajesSection');
    if (!auth.isAuthenticated) {
      section.style.display = 'none';
      return;
    }

    const user = auth.getCurrentUser();
    const scores = window.DataManager.getGameScoresByUser(user.userId);

    if (scores.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    const tbody = document.getElementById('misPuntajesTable');
    tbody.innerHTML = scores.slice().reverse().map(s => `
      <tr>
        <td>${s.game}</td>
        <td>${s.score}</td>
        <td>${s.prize}</td>
        <td>${new Date(s.date).toLocaleString('es-ES')}</td>
      </tr>
    `).join('');
  },

  renderMisDescuentos() {
    const auth = window.AuthManager;
    const section = document.getElementById('misDescuentosSection');
    if (!auth.isAuthenticated) {
      section.style.display = 'none';
      return;
    }

    const user = auth.getCurrentUser();
    const activos = window.DataManager.getActiveUserDiscounts(user.userId);

    if (activos.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    document.getElementById('misDescuentosList').innerHTML = activos.map(d => `
      <span class="discount-chip">${Icons.svg('tag', { size: 14 })} ${d.percentage}% &mdash; código ${d.code}</span>
    `).join('');
  },

  // ==================== LÍMITES DIARIOS (genérico, por juego y por perfil) ====================
  // límite real: se controla en Supabase (tabla game_plays + trigger), no en localStorage

  async getIntentosRestantes(gameKey, maxPorDia) {
    const auth = window.AuthManager;
    if (!auth.isAuthenticated) return maxPorDia;
    const user = auth.getCurrentUser();

    const inicioDeHoy = new Date();
    inicioDeHoy.setHours(0, 0, 0, 0);

    const { count, error } = await window.supabaseClient
      .from('game_plays')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', user.userId)
      .eq('game', gameKey)
      .gte('created_at', inicioDeHoy.toISOString());

    if (error) {
      console.error('Error al consultar intentos de hoy:', error.message);
      return maxPorDia; // si falla la consulta, no bloqueamos al usuario por un problema nuestro
    }
    return Math.max(0, maxPorDia - (count || 0));
  },

  async registrarIntento(gameKey) {
    const auth = window.AuthManager;
    const user = auth.getCurrentUser();

    const { error } = await window.supabaseClient
      .from('game_plays')
      .insert({ usuario_id: user.userId, game: gameKey });

    if (error) {
      // si el trigger rechaza el insert, ya se alcanzó el límite del día
      throw new Error('Ya usaste tus intentos disponibles por hoy. Vuelve mañana.');
    }
  },

  // ==================== RULETA ====================

  async getGirosRestantes() {
    return this.getIntentosRestantes('ruleta', MAX_GIROS_POR_DIA);
  },

  async registrarGiro() {
    await this.registrarIntento('ruleta');
  },

  async actualizarContadorGiros() {
    const restantes = await this.getGirosRestantes();
    const label = document.getElementById('ruletaLimitValue');
    const modalLabel = document.getElementById('spinsRemainingText');
    if (label) label.textContent = restantes;
    if (modalLabel) modalLabel.textContent = restantes;

    const btn = document.getElementById('btn-girar');
    if (btn) btn.disabled = restantes <= 0;
  },

  async playRuleta() {
    if (!this.requireAuth('ruleta')) return;
    document.getElementById('resultadoRuleta').textContent = '';
    await this.actualizarContadorGiros();
    document.getElementById('modalsRuleta').classList.add('active');
  },

  async girarRuleta() {
    const btn = document.getElementById('btn-girar');
    if (btn.disabled) return;
    if (!this.requireAuth()) return;

    const restantes = await this.getGirosRestantes();
    if (restantes <= 0) {
      window.UIManager.toast('Ya usaste tus giros disponibles por hoy. Vuelve mañana.', 'warning');
      return;
    }

    const wheel = document.getElementById('wheelRuleta');
    btn.disabled = true;
    document.getElementById('resultadoRuleta').textContent = '';

    // rotación acumulada para que siempre gire hacia adelante
    const vueltasCompletas = Math.floor(Math.random() * 4) + 6; // 6 a 9 vueltas
    const anguloParadaAleatorio = Math.random() * 360;
    this.ruletaRotationAcumulada += (360 * vueltasCompletas) + anguloParadaAleatorio;

    wheel.style.transform = `rotate(${this.ruletaRotationAcumulada}deg)`;

    setTimeout(async () => {
      try {
        await this.registrarGiro();
      } catch (err) {
        window.UIManager.toast(err.message, 'warning');
        btn.disabled = false;
        await this.actualizarContadorGiros();
        return;
      }

      // premio calculado del ángulo real donde se detuvo, para que coincida con el puntero
      const normalized = ((this.ruletaRotationAcumulada % 360) + 360) % 360;
      const anguloPuntero = (360 - normalized) % 360;
      const segmento = Math.floor(anguloPuntero / 60) % RULETA_SEGMENTOS.length;
      const premio = RULETA_SEGMENTOS[segmento].premio;

      const auth = window.AuthManager;
      const user = auth.getCurrentUser();

      try {
        await window.DataManager.recordGameScore(
          user.userId,
          user.username,
          'Ruleta de Descuentos',
          segmento + 1,
          `${premio}%`
        );
      } catch (err) {
        console.error('No se pudo guardar el puntaje de la ruleta:', err.message);
        window.UIManager.toast('No se pudo registrar la partida: ' + err.message, 'error');
      }

      const discount = await window.DataManager.addUserDiscount(user.userId, premio, 'ruleta');

      window.UIManager.toast(`Ganaste ${premio}% de descuento. Código: ${discount.code}`, 'success');
      document.getElementById('resultadoRuleta').textContent =
        `Descuento: ${premio}% — código ${discount.code}`;

      await this.actualizarContadorGiros();
      this.renderMisPuntajes();
      this.renderMisDescuentos();
    }, 4200);
  },

  // ==================== MEMORIA ====================

  async getMemoriaRestantes() {
    return this.getIntentosRestantes('memoria', MAX_MEMORIA_POR_DIA);
  },

  async actualizarContadorMemoria() {
    const restantes = await this.getMemoriaRestantes();
    const label = document.getElementById('memoriaLimitValue');
    if (label) label.textContent = restantes;
  },

  async playMemoria() {
    if (!this.requireAuth('memoria')) return;

    const restantes = await this.getMemoriaRestantes();
    if (restantes <= 0) {
      window.UIManager.toast('Ya usaste tus intentos de Memoria disponibles por hoy. Vuelve mañana.', 'warning');
      return;
    }

    try {
      await this.registrarIntento('memoria');
    } catch (err) {
      window.UIManager.toast(err.message, 'warning');
      await this.actualizarContadorMemoria();
      return;
    }

    await this.actualizarContadorMemoria();
    document.getElementById('modalsMemoria').classList.add('active');
    this.resetMemoria();
  },

  iniciarTemporizador() {
    this.pararTemporizador();
    this.memoria.startTime = Date.now();
    this.memoria.segundos = 0;
    document.getElementById('memoriaTimerValue').textContent = '0';
    this.memoria.timerInterval = setInterval(() => {
      this.memoria.segundos = Math.floor((Date.now() - this.memoria.startTime) / 1000);
      document.getElementById('memoriaTimerValue').textContent = this.memoria.segundos;
    }, 1000);
  },

  pararTemporizador() {
    if (this.memoria.timerInterval) {
      clearInterval(this.memoria.timerInterval);
      this.memoria.timerInterval = null;
    }
  },

  resetMemoria() {
    const grid = document.getElementById('gridMemoria');
    const iconKeys = [...MEMORY_ICON_KEYS, ...MEMORY_ICON_KEYS];
    const shuffled = iconKeys
      .map(key => ({ key, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(item => item.key);

    this.memoria.intentos = 0;
    this.memoria.aciertos = 0;
    this.memoria.lockBoard = false;

    grid.innerHTML = shuffled.map((key, index) => `
      <div class="memory-card" data-index="${index}" data-key="${key}" data-flipped="false" data-matched="false">
      </div>
    `).join('');

    grid.querySelectorAll('.memory-card').forEach(el => {
      el.addEventListener('click', () => this.voltearTarjeta(el));
    });

    document.getElementById('resultadoMemoria').textContent = 'Encuentra todas las parejas';
    this.iniciarTemporizador();
  },

  voltearTarjeta(el) {
    if (this.memoria.lockBoard) return;
    if (el.getAttribute('data-matched') === 'true') return;
    if (el.getAttribute('data-flipped') === 'true') return;

    const grid = document.getElementById('gridMemoria');
    // solo cartas sin resolver (matched=false), las parejas ya encontradas no cuentan
    const flippedUnresolved = grid.querySelectorAll('[data-flipped="true"][data-matched="false"]');
    if (flippedUnresolved.length >= 2) return;

    el.textContent = '';
    el.innerHTML = Icons.svg(el.getAttribute('data-key'), { size: 26 });
    el.classList.add('is-flipped');
    el.setAttribute('data-flipped', 'true');

    const flipped = grid.querySelectorAll('[data-flipped="true"][data-matched="false"]');
    if (flipped.length === 2) {
      this.memoria.intentos++;
      const [a, b] = flipped;

      if (a.getAttribute('data-key') === b.getAttribute('data-key')) {
        a.setAttribute('data-matched', 'true');
        b.setAttribute('data-matched', 'true');
        a.classList.remove('is-flipped');
        b.classList.remove('is-flipped');
        a.classList.add('is-matched');
        b.classList.add('is-matched');
        this.memoria.aciertos++;
        window.UIManager.toast('Pareja encontrada', 'success');
        this.comprobarFinDeJuego();
      } else {
        this.memoria.lockBoard = true;
        setTimeout(() => {
          a.innerHTML = '';
          b.innerHTML = '';
          a.classList.remove('is-flipped');
          b.classList.remove('is-flipped');
          a.setAttribute('data-flipped', 'false');
          b.setAttribute('data-flipped', 'false');
          this.memoria.lockBoard = false;
        }, 900);
      }
    }
  },

  comprobarFinDeJuego() {
    const grid = document.getElementById('gridMemoria');
    const matched = grid.querySelectorAll('[data-matched="true"]').length;
    if (matched !== MEMORY_ICON_KEYS.length * 2) return;

    setTimeout(async () => {
      this.pararTemporizador();
      const creditosGanados = Math.max(50, 300 - (this.memoria.intentos * 10) - this.memoria.segundos);

      const auth = window.AuthManager;
      const user = auth.getCurrentUser();

      try {
        await window.DataManager.recordGameScore(
          user.userId,
          user.username,
          'Juego de Memoria',
          this.memoria.intentos,
          `${creditosGanados} créditos`
        );
      } catch (err) {
        console.error('No se pudo guardar el puntaje de Memoria:', err.message);
        window.UIManager.toast('No se pudo registrar la partida: ' + err.message, 'error');
      }

      auth.updateUserCredits(user.userId, creditosGanados)
        .then(updated => { if (updated) auth.profile.credits = updated.credits; })
        .catch(err => {
          console.error('No se pudieron sumar los créditos:', err.message);
          window.UIManager.toast('No se pudieron sumar los créditos: ' + err.message, 'error');
        });

      window.UIManager.toast(`Completaste el juego en ${this.memoria.segundos}s. Ganaste ${creditosGanados} créditos`, 'success');
      document.getElementById('resultadoMemoria').textContent =
        `Completado en ${this.memoria.segundos}s — +${creditosGanados} créditos`;
      this.renderMisPuntajes();
    }, 400);
  },

  closeModal(game) {
    const modal = document.getElementById('modals' + game.charAt(0).toUpperCase() + game.slice(1));
    modal.classList.remove('active');
    if (game === 'memoria') this.pararTemporizador();
  },

  // ==================== TRIVIA ====================

  async getTriviaRestantes() {
    return this.getIntentosRestantes('trivia', MAX_TRIVIA_POR_DIA);
  },

  async actualizarContadorTrivia() {
    const restantes = await this.getTriviaRestantes();
    const label = document.getElementById('triviaLimitValue');
    if (label) label.textContent = restantes;
  },

  async playTrivia() {
    if (!this.requireAuth('trivia')) return;

    const restantes = await this.getTriviaRestantes();
    if (restantes <= 0) {
      window.UIManager.toast('Ya usaste tus intentos de Trivia disponibles por hoy. Vuelve mañana.', 'warning');
      return;
    }

    try {
      await this.registrarIntento('trivia');
    } catch (err) {
      window.UIManager.toast(err.message, 'warning');
      await this.actualizarContadorTrivia();
      return;
    }

    await this.actualizarContadorTrivia();

    this.trivia.preguntaActual = 0;
    this.trivia.correctas = 0;
    this.trivia.respondida = false;

    document.getElementById('modalsTrivia').classList.add('active');
    document.getElementById('resultadoTrivia').textContent = '';
    this.renderPreguntaTrivia();
  },

  renderPreguntaTrivia() {
    const p = TRIVIA_PREGUNTAS[this.trivia.preguntaActual];
    const contador = document.getElementById('triviaContador');
    if (contador) contador.textContent = `Pregunta ${this.trivia.preguntaActual + 1} de ${TRIVIA_PREGUNTAS.length}`;

    const contenedor = document.getElementById('triviaPregunta');
    contenedor.innerHTML = `
      <p style="color:#e8ecf1; font-weight:700; margin-bottom:16px;">${p.pregunta}</p>
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${p.opciones.map((op, i) => `
          <button type="button" class="game-btn" style="justify-content:flex-start;" onclick="GamesController.responderTrivia(${i})">
            ${op}
          </button>
        `).join('')}
      </div>
    `;
  },

  responderTrivia(indiceElegido) {
    if (this.trivia.respondida) return;
    this.trivia.respondida = true;

    const p = TRIVIA_PREGUNTAS[this.trivia.preguntaActual];
    const esCorrecta = indiceElegido === p.correcta;
    if (esCorrecta) this.trivia.correctas++;

    window.UIManager.toast(esCorrecta ? 'Correcto' : `Incorrecto. La respuesta era: ${p.opciones[p.correcta]}`, esCorrecta ? 'success' : 'error');

    setTimeout(() => {
      this.trivia.preguntaActual++;
      this.trivia.respondida = false;

      if (this.trivia.preguntaActual < TRIVIA_PREGUNTAS.length) {
        this.renderPreguntaTrivia();
      } else {
        this.finalizarTrivia();
      }
    }, 1000);
  },

  async finalizarTrivia() {
    const creditosGanados = this.trivia.correctas * 20;
    const auth = window.AuthManager;
    const user = auth.getCurrentUser();

    try {
      await window.DataManager.recordGameScore(
        user.userId,
        user.username,
        'Trivia PaperCraft',
        `${this.trivia.correctas}/${TRIVIA_PREGUNTAS.length}`,
        `${creditosGanados} créditos`
      );
    } catch (err) {
      console.error('No se pudo guardar el puntaje de Trivia:', err.message);
      window.UIManager.toast('No se pudo registrar la partida: ' + err.message, 'error');
    }

    if (creditosGanados > 0) {
      auth.updateUserCredits(user.userId, creditosGanados)
        .then(updated => { if (updated) auth.profile.credits = updated.credits; })
        .catch(err => {
          console.error('No se pudieron sumar los créditos:', err.message);
          window.UIManager.toast('No se pudieron sumar los créditos: ' + err.message, 'error');
        });
    }

    document.getElementById('triviaPregunta').innerHTML = '';
    document.getElementById('triviaContador').textContent = '';
    document.getElementById('resultadoTrivia').textContent =
      `Respondiste ${this.trivia.correctas}/${TRIVIA_PREGUNTAS.length} correctas — +${creditosGanados} créditos`;

    window.UIManager.toast(`Trivia completada. Ganaste ${creditosGanados} créditos`, 'success');
    this.renderMisPuntajes();
  },

  // ==================== DADO DE LA SUERTE ====================

  async getDadoRestantes() {
    return this.getIntentosRestantes('dado', MAX_DADO_POR_DIA);
  },

  async actualizarContadorDado() {
    const restantes = await this.getDadoRestantes();
    const label = document.getElementById('dadoLimitValue');
    const modalLabel = document.getElementById('dadoRestantesText');
    if (label) label.textContent = restantes;
    if (modalLabel) modalLabel.textContent = restantes;

    const btn = document.getElementById('btn-lanzar-dado');
    if (btn) btn.disabled = restantes <= 0;
  },

  async playDado() {
    if (!this.requireAuth('dado')) return;
    document.getElementById('resultadoDado').textContent = '';
    document.getElementById('dadoCara').textContent = '?';
    await this.actualizarContadorDado();
    document.getElementById('modalsDado').classList.add('active');
  },

  async lanzarDado() {
    const btn = document.getElementById('btn-lanzar-dado');
    if (btn.disabled) return;
    if (!this.requireAuth('dado')) return;

    const restantes = await this.getDadoRestantes();
    if (restantes <= 0) {
      window.UIManager.toast('Ya usaste tus tiradas disponibles por hoy. Vuelve mañana.', 'warning');
      return;
    }

    btn.disabled = true;
    const cara = document.getElementById('dadoCara');
    let vueltas = 0;

    const animacion = setInterval(() => {
      cara.textContent = String(Math.floor(Math.random() * 6) + 1);
      vueltas++;
      if (vueltas >= 12) {
        clearInterval(animacion);

        (async () => {
          try {
            await this.registrarIntento('dado');
          } catch (err) {
            window.UIManager.toast(err.message, 'warning');
            await this.actualizarContadorDado();
            return;
          }

          const resultado = Math.floor(Math.random() * 6) + 1;
          cara.textContent = String(resultado);
          const creditosGanados = resultado * 10;

          const auth = window.AuthManager;
          const user = auth.getCurrentUser();
          try {
            await window.DataManager.recordGameScore(
              user.userId,
              user.username,
              'Dado de la Suerte',
              resultado,
              `${creditosGanados} créditos`
            );
          } catch (err) {
            console.error('No se pudo guardar el puntaje del Dado:', err.message);
            window.UIManager.toast('No se pudo registrar la partida: ' + err.message, 'error');
          }

          auth.updateUserCredits(user.userId, creditosGanados)
            .then(updated => { if (updated) auth.profile.credits = updated.credits; })
            .catch(err => {
              console.error('No se pudieron sumar los créditos:', err.message);
              window.UIManager.toast('No se pudieron sumar los créditos: ' + err.message, 'error');
            });

          window.UIManager.toast(`Sacaste ${resultado}. Ganaste ${creditosGanados} créditos`, 'success');
          document.getElementById('resultadoDado').textContent = `Sacaste ${resultado} — +${creditosGanados} créditos`;

          await this.actualizarContadorDado();
          this.renderMisPuntajes();
        })();
      }
    }, 80);
  }
};

// Puentes globales usados por los atributos onclick del HTML
function playRuleta() { GamesController.playRuleta(); }
function girarRuleta() { GamesController.girarRuleta(); }
function playMemoria() { GamesController.playMemoria(); }
function resetMemoria() { GamesController.resetMemoria(); }
function playTrivia() { GamesController.playTrivia(); }
function playDado() { GamesController.playDado(); }
function lanzarDado() { GamesController.lanzarDado(); }
function closeModal(game) { GamesController.closeModal(game); }
