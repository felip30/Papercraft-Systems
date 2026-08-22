/**
 * GESTIÓN DE UI Y NOTIFICACIONES AVANZADA - PaperCraft Systems
 * Toast notifications, modales, y actualización de interfaz
 */

/**
 * Limpia cualquier texto antes de insertarlo como HTML, para que no se
 * pueda ejecutar código a través de campos controlados por el usuario
 * (por ejemplo, el nombre de usuario elegido al registrarse). Sin esto,
 * alguien podría registrarse con un "usuario" que en realidad sea código
 * malicioso, y ese código se ejecutaría en el navegador de cualquiera que
 * lo vea — incluyendo un administrador en el panel de Usuarios.
 */
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
window.escapeHtml = escapeHtml;

// si se abre esta cuenta en otro dispositivo, esta pestaña se cierra sola
window.addEventListener('sessionKicked', () => {
  alert('Tu sesión se cerró porque esta cuenta se inició en otro dispositivo.');
  location.href = 'index.html';
});

// Menú hamburguesa del navbar (pantallas chicas)
function toggleMobileNav() {
  const links = document.getElementById('navLinks');
  const btn = document.getElementById('navHamburger');
  if (!links || !btn) return;
  links.classList.toggle('nav-links-open');
  btn.classList.toggle('nav-hamburger-open');
}

// Cierra el menú móvil solo al elegir un link (evita que quede abierto
// tapando la página después de navegar), sin cerrarse a sí mismo cuando
// el toque que lo abre es justo sobre el botón de hamburguesa.
window.addEventListener('click', (e) => {
  const links = document.getElementById('navLinks');
  const btn = document.getElementById('navHamburger');
  if (!links || !btn || !links.classList.contains('nav-links-open')) return;
  if (btn.contains(e.target)) return;
  if (links.contains(e.target) && e.target.tagName !== 'A') return;
  links.classList.remove('nav-links-open');
  btn.classList.remove('nav-hamburger-open');
});

class UIManager {
  constructor() {
    this.initToastContainer();
    this.setupEventListeners();
  }

  // ======================================
  // SISTEMA DE NOTIFICACIONES TOAST
  // ======================================

  initToastContainer() {
    if (document.getElementById('toast-container')) return;

    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10500;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    document.body.appendChild(container);
  }

  toast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');

    const styles = {
      success: {
        bg: 'rgba(57, 255, 20, 0.2)',
        border: '2px solid #39FF14',
        color: '#39FF14'
      },
      error: {
        bg: 'rgba(255, 0, 110, 0.2)',
        border: '2px solid #FF006E',
        color: '#FF006E'
      },
      info: {
        bg: 'rgba(0, 217, 255, 0.2)',
        border: '2px solid #00D9FF',
        color: '#00D9FF'
      },
      warning: {
        bg: 'rgba(255, 200, 0, 0.2)',
        border: '2px solid #FFC800',
        color: '#FFC800'
      }
    };

    const style = styles[type] || styles.info;

    toast.style.cssText = `
      background: ${style.bg};
      border: ${style.border};
      color: ${style.color};
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.9rem;
      backdrop-filter: blur(10px);
      box-shadow: 0 0 20px ${style.color.replace(/[^,]+(?=\))/, '0.5')};
      animation: slideIn 0.3s ease-out;
      max-width: 300px;
    `;

    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ======================================
  // EVENT LISTENERS
  // ======================================

  setupEventListeners() {
    window.addEventListener('userLoggedIn', () => this.updateNavbar());
    window.addEventListener('userLoggedOut', () => this.updateNavbar());
    window.addEventListener('roleChanged', () => this.updateNavbar());
  }

  // ======================================
  // MODALES Y DIÁLOGOS
  // ======================================

  openModal(content, title = 'Modal', onClose = null) {
    let modal = document.getElementById('custom-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'custom-modal';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
      `;
      document.body.appendChild(modal);
    }

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: rgba(10, 14, 39, 0.95);
      border: 2px solid #00D9FF;
      border-radius: 12px;
      padding: 30px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 0 40px rgba(0, 217, 255, 0.5);
      animation: slideIn 0.3s ease-out;
    `;

    modalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="color: #00D9FF; font-size: 1.5rem; margin: 0;">${title}</h2>
        <button onclick="window.UIManager.closeModal()" 
                style="background: none; border: none; color: #FF006E; font-size: 24px; cursor: pointer; padding: 0; line-height: 1;">&times;</button>
      </div>
      <div>${content}</div>
    `;

    modal.innerHTML = '';
    modal.appendChild(modalContent);
    modal.style.display = 'flex';
    if (window.Icons) window.Icons.hydrate(modalContent);

    // Bloquea el scroll de la página de fondo mientras el modal está
    // abierto (con overflow: hidden, no con position: fixed — esa otra
    // técnica es la que causaba que se viera un fondo blanco al abrir
    // cualquier modal, porque afecta cómo el navegador pinta el fondo
    // detrás de la lluvia de números).
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // Cerrar al hacer click fuera
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal();
        if (onClose) onClose();
      }
    });

    this.currentModalOnClose = onClose;
  }

  closeModal() {
    const modal = document.getElementById('custom-modal');
    if (modal) {
      modal.style.display = 'none';
      if (this.currentModalOnClose) {
        this.currentModalOnClose();
        this.currentModalOnClose = null;
      }
    }

    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  // ======================================
  // ACTUALIZAR NAVBAR
  // ======================================

  updateNavbar() {
    const auth = window.AuthManager;
    const navbar = document.querySelector('.navbar-auth-section');
    
    if (!navbar) return;

    if (auth.isAuthenticated) {
      const user = auth.getCurrentUser();
      const avatarHtml = user.avatarUrl
        ? `<img src="${escapeHtml(user.avatarUrl)}" alt="Foto de perfil" onclick="viewNavbarAvatar(event, '${escapeHtml(user.avatarUrl)}')" style="width:80px; height:80px; border-radius:50%; object-fit:cover; border:3px solid #00D9FF; cursor:pointer; transition:transform 0.2s, box-shadow 0.2s;" onmouseenter="this.style.transform='scale(1.06)'; this.style.boxShadow='0 0 18px rgba(0,217,255,0.7)';" onmouseleave="this.style.transform='scale(1)'; this.style.boxShadow='none';">`
        : `<span data-icon="user" data-icon-size="18" style="color:#00D9FF;"></span>`;
      navbar.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px;">
          <span style="color: #00D9FF; font-weight: 700; display:flex; align-items:center; gap:8px;">
            ${avatarHtml}
            ${escapeHtml(user.username)} 
            <span style="color: #FF006E;">${user.isAdmin ? 'Administrador' : 'Cliente'}</span>
          </span>
          <button onclick="logout()" class="btn btn-logout" style="padding: 8px 15px; font-size: 0.9rem;">
             Logout
          </button>
        </div>
      `;
      Icons.hydrate(navbar);
    } else {
      navbar.innerHTML = `
        <button onclick="openLoginModal()" class="btn" style="padding: 8px 15px; font-size: 0.9rem;">
           Iniciar Sesión
        </button>
        <button onclick="openRegisterModal()" class="btn" style="padding: 8px 15px; font-size: 0.9rem;">
           Registrarse
        </button>
      `;
    }
  }

  // ======================================
  // ACTUALIZACIÓN DE UI SEGÚN ROL
  // ======================================

  updateUIByRole() {
    const auth = window.AuthManager;

    // Mostrar/ocultar elementos según rol
    document.querySelectorAll('[data-admin-only]').forEach(el => {
      el.style.display = auth.hasPermission('admin') ? 'block' : 'none';
    });

    document.querySelectorAll('[data-client-only]').forEach(el => {
      el.style.display = auth.hasPermission('cliente') ? 'block' : 'none';
    });

    document.querySelectorAll('[data-auth-only]').forEach(el => {
      el.style.display = auth.isAuthenticated ? 'block' : 'none';
    });

    document.querySelectorAll('[data-public-only]').forEach(el => {
      el.style.display = !auth.isAuthenticated ? 'block' : 'none';
    });

    this.updateNavbar();
  }
}

// Global instance
window.UIManager = new UIManager();

// ======================================
// INYECTAR ESTILOS GLOBALES
// ======================================

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }

  [data-admin-only], [data-client-only], [data-auth-only], [data-public-only] {
    transition: all 0.3s;
  }

  .btn {
    padding: 10px 20px;
    background: linear-gradient(135deg, #00D9FF, #0066FF);
    color: #0a0e27;
    border: 2px solid #00D9FF;
    border-radius: 8px;
    text-decoration: none;
    cursor: pointer;
    font-weight: 700;
    transition: all 0.3s;
    box-shadow: 0 0 20px rgba(0, 217, 255, 0.5);
    font-family: 'Segoe UI', sans-serif;
  }

  .btn:hover {
    box-shadow: 0 0 40px rgba(0, 217, 255, 0.8);
    transform: translateY(-2px);
  }

  .btn-logout {
    background: linear-gradient(135deg, #FF006E, #cc0055) !important;
    border-color: #FF006E !important;
    color: #ffffff !important;
  }

  .btn-logout:hover {
    box-shadow: 0 0 40px rgba(255, 0, 110, 0.8) !important;
  }

  .btn-danger {
    background: linear-gradient(135deg, #FF006E, #cc0055);
    border-color: #FF006E;
    color: #ffffff;
  }

  .btn-danger:hover {
    box-shadow: 0 0 40px rgba(255, 0, 110, 0.8);
  }

  .btn-success {
    background: linear-gradient(135deg, #39FF14, #00D9FF);
    border-color: #39FF14;
    color: #0a0e27;
  }

  .btn-success:hover {
    box-shadow: 0 0 40px rgba(57, 255, 20, 0.8);
  }
  .field-hint {
    font-size: 0.8rem;
    margin-top: -4px;
    min-height: 14px;
    transition: color 0.2s;
  }

  .field-hint.is-error { color: #FF006E; }
  .field-hint.is-ok { color: #39FF14; }

  .password-field-wrap { position: relative; display: flex; }
  .password-field-wrap input { flex: 1; padding-right: 44px !important; }
  .password-toggle-btn {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #a8b8cc;
    cursor: pointer;
    padding: 6px;
    display: flex;
    align-items: center;
    border-radius: 6px;
    transition: color 0.2s;
  }
  .password-toggle-btn:hover { color: #00D9FF; }
`;
document.head.appendChild(style);

// ======================================
// MOSTRAR / OCULTAR CONTRASEÑA
// ======================================

function togglePasswordVisibility(btn, inputId) {
  const input = document.getElementById(inputId);
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.innerHTML = Icons.svg(isHidden ? 'eyeOff' : 'eye', { size: 18 });
  btn.setAttribute('aria-label', isHidden ? 'Ocultar contraseña' : 'Mostrar contraseña');
}

// Envuelve un <input type="password" id="..."> con un botón de mostrar/ocultar.
// Se usa directamente en el HTML de los formularios (ver más abajo).
function passwordFieldWrapper(inputHtml, inputId) {
  return `
    <div class="password-field-wrap">
      ${inputHtml}
      <button type="button" class="password-toggle-btn" onclick="togglePasswordVisibility(this, '${inputId}')" aria-label="Mostrar contraseña" tabindex="-1">
        ${Icons.svg('eye', { size: 18 })}
      </button>
    </div>
  `;
}

// ======================================
// VALIDACIÓN EN LÍNEA DE CONTRASEÑAS (feedback mientras se escribe)
// ======================================

const PasswordValidation = {
  checkStrength(passwordFieldId, hintId) {
    const value = document.getElementById(passwordFieldId).value;
    const hint = document.getElementById(hintId);
    if (!value) {
      hint.textContent = '';
      hint.className = 'field-hint';
      return;
    }
    if (value.length < 6) {
      hint.textContent = `Faltan ${6 - value.length} caracteres para el mínimo requerido`;
      hint.className = 'field-hint is-error';
    } else {
      hint.textContent = 'Contraseña válida';
      hint.className = 'field-hint is-ok';
    }
  },

  checkMatch(passwordFieldId, confirmFieldId, hintId) {
    const password = document.getElementById(passwordFieldId).value;
    const confirm = document.getElementById(confirmFieldId).value;
    const hint = document.getElementById(hintId);
    if (!confirm) {
      hint.textContent = '';
      hint.className = 'field-hint';
      return;
    }
    if (password !== confirm) {
      hint.textContent = 'Las contraseñas no coinciden';
      hint.className = 'field-hint is-error';
    } else {
      hint.textContent = 'Las contraseñas coinciden';
      hint.className = 'field-hint is-ok';
    }
  }
};

// ======================================
// FUNCIONES GLOBALES COMPARTIDAS (disponibles en TODAS las páginas)
// Login, Registro, Recuperación de Contraseña, Mi Perfil y Logout
// ======================================

// Modal de Login
function openLoginModal() {
  const content = `
    <form onsubmit="handleLogin(event)" style="display: flex; flex-direction: column; gap: 15px;">
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <label style="color: #00D9FF; font-weight: 700;">Usuario o Email</label>
        <input type="text" id="login-user" placeholder="Tu usuario o email" required
               oninput="this.value = this.value.replace(/\\s/g, '')"
               style="padding: 12px; background: rgba(15, 24, 41, 0.8); border: 2px solid #00D9FF; color: #e8ecf1; border-radius: 8px; font-size: 1rem;">
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <label style="color: #00D9FF; font-weight: 700;">Contraseña</label>
        ${passwordFieldWrapper(`<input type="password" id="login-pass" placeholder="Tu contraseña" required
               style="padding: 12px; background: rgba(15, 24, 41, 0.8); border: 2px solid #00D9FF; color: #e8ecf1; border-radius: 8px; font-size: 1rem;">`, 'login-pass')}
      </div>
      <button type="submit" class="btn" style="width: 100%; padding: 12px; margin-top: 10px;">
        Ingresar
      </button>
      <button type="button" onclick="openPasswordRecoveryModal()" style="background: transparent; color: #39FF14; border: 1px solid #39FF14; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 700;">
        ¿Olvidaste tu contraseña?
      </button>
      <button type="button" onclick="openRegisterModal()" style="background: transparent; color: #a8b8cc; border: none; padding: 6px; cursor: pointer; font-weight: 600; text-decoration: underline;">
        ¿No tienes cuenta? Regístrate
      </button>
    </form>
  `;
  window.UIManager.openModal(content, 'Iniciar Sesión');
}

// Modal de Registro
function openRegisterModal() {
  const content = `
    <form onsubmit="handleRegister(event)" style="display: flex; flex-direction: column; gap: 15px;">
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <label style="color: #00D9FF; font-weight: 700;">Nombre de usuario</label>
        <input type="text" id="register-user" placeholder="Tu usuario único" required maxlength="13"
               oninput="this.value = this.value.replace(/\\s/g, '')"
               style="padding: 12px; background: rgba(15, 24, 41, 0.8); border: 2px solid #00D9FF; color: #e8ecf1; border-radius: 8px; font-size: 1rem;">
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <label style="color: #00D9FF; font-weight: 700;">Correo electrónico</label>
        <input type="email" id="register-email" placeholder="tu@email.com" required maxlength="254"
               oninput="this.value = this.value.replace(/\\s/g, '')"
               style="padding: 12px; background: rgba(15, 24, 41, 0.8); border: 2px solid #00D9FF; color: #e8ecf1; border-radius: 8px; font-size: 1rem;">
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <label style="color: #00D9FF; font-weight: 700;">Contraseña</label>
        ${passwordFieldWrapper(`<input type="password" id="register-pass" placeholder="Mínimo 6 caracteres" required
               oninput="PasswordValidation.checkStrength('register-pass', 'register-pass-hint')"
               style="padding: 12px; background: rgba(15, 24, 41, 0.8); border: 2px solid #00D9FF; color: #e8ecf1; border-radius: 8px; font-size: 1rem;">`, 'register-pass')}
        <p id="register-pass-hint" class="field-hint"></p>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <label style="color: #00D9FF; font-weight: 700;">Confirmar contraseña</label>
        ${passwordFieldWrapper(`<input type="password" id="register-pass-confirm" placeholder="Confirma tu contraseña" required
               oninput="PasswordValidation.checkMatch('register-pass', 'register-pass-confirm', 'register-match-hint')"
               style="padding: 12px; background: rgba(15, 24, 41, 0.8); border: 2px solid #00D9FF; color: #e8ecf1; border-radius: 8px; font-size: 1rem;">`, 'register-pass-confirm')}
        <p id="register-match-hint" class="field-hint"></p>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <label style="color: #00D9FF; font-weight: 700;">Pregunta de seguridad</label>
        <select id="register-question" required style="padding: 12px; background: rgba(15, 24, 41, 0.8); border: 2px solid #00D9FF; color: #e8ecf1; border-radius: 8px; font-size: 1rem;">
          <option value="">Selecciona una pregunta</option>
          <option value="¿Cuál es tu color favorito?">¿Cuál es tu color favorito?</option>
          <option value="¿Nombre de tu mascota?">¿Nombre de tu mascota?</option>
          <option value="¿Ciudad donde naciste?">¿Ciudad donde naciste?</option>
          <option value="¿Tu película favorita?">¿Tu película favorita?</option>
        </select>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <label style="color: #00D9FF; font-weight: 700;">Respuesta</label>
        <input type="text" id="register-answer" placeholder="Tu respuesta" required
               style="padding: 12px; background: rgba(15, 24, 41, 0.8); border: 2px solid #00D9FF; color: #e8ecf1; border-radius: 8px; font-size: 1rem;">
        <p style="color:#6b7a90; font-size:0.72rem;">Se guarda cifrada — ni siquiera nosotros podemos ver tu respuesta real.</p>
      </div>
      <button type="submit" class="btn" style="width: 100%; padding: 12px; margin-top: 10px;">
        Crear Cuenta
      </button>
    </form>
  `;
  window.UIManager.openModal(content, 'Crear Cuenta');
}

// Recuperación de contraseña (3 pasos: email -> pregunta de seguridad -> nueva contraseña)
function openPasswordRecoveryModal() {
  const content = `
    <form onsubmit="handleRecoveryStep1(event)" style="display: flex; flex-direction: column; gap: 15px;">
      <p style="color: #a8b8cc; margin-bottom: 10px;">
        Ingresa tu usuario o correo. Primero te haremos tu pregunta de seguridad para confirmar que eres tú.
      </p>
      <input type="text" id="recovery-identifier" placeholder="Tu usuario o correo" required
             style="padding: 12px; background: rgba(15, 24, 41, 0.8); border: 2px solid #00D9FF; color: #e8ecf1; border-radius: 8px; font-size: 1rem;">
      <button type="submit" class="btn" style="width: 100%; padding: 12px;">
        Siguiente
      </button>
    </form>
  `;

  window.UIManager.openModal(content, 'Recuperar Contraseña');
}

async function handleRecoveryStep1(event) {
  event.preventDefault();
  const identifier = document.getElementById('recovery-identifier').value.trim();

  if (!identifier) {
    window.UIManager.toast('Ingresa tu usuario o correo', 'warning');
    return;
  }

  const result = await window.AuthManager.getSecurityQuestion(identifier);

  if (!result.success) {
    window.UIManager.toast(result.message, 'error');
    return;
  }

  window.recoveryIdentifier = identifier;

  // Cuentas creadas antes de tener pregunta de seguridad (o que la dejaron
  // vacía) van directo al envío del correo, sin este paso extra.
  if (!result.question) {
    await enviarCorreoRecuperacion(identifier);
    return;
  }

  const content = `
    <form onsubmit="handleRecoveryStep2(event)" style="display: flex; flex-direction: column; gap: 15px;">
      <p style="color: #a8b8cc; margin-bottom: 6px;">Responde tu pregunta de seguridad:</p>
      <p style="color: #00D9FF; font-weight: 700; margin-bottom: 6px;">${escapeHtml(result.question)}</p>
      <input type="text" id="recovery-answer" placeholder="Tu respuesta" required
             style="padding: 12px; background: rgba(15, 24, 41, 0.8); border: 2px solid #00D9FF; color: #e8ecf1; border-radius: 8px; font-size: 1rem;">
      <button type="submit" class="btn" style="width: 100%; padding: 12px;">
        Verificar
      </button>
    </form>
  `;
  window.UIManager.openModal(content, 'Recuperar Contraseña');
}

async function handleRecoveryStep2(event) {
  event.preventDefault();
  const answer = document.getElementById('recovery-answer').value;

  const result = await window.AuthManager.verifySecurityAnswer(window.recoveryIdentifier, answer);

  if (!result.success) {
    window.UIManager.toast(result.message, 'error');
    return;
  }

  await enviarCorreoRecuperacion(window.recoveryIdentifier);
}

async function enviarCorreoRecuperacion(identifier) {
  const email = await window.AuthManager.resolveEmail(identifier);
  if (!email) {
    window.UIManager.toast('No encontramos el correo de esa cuenta', 'error');
    return;
  }

  const result = await window.AuthManager.initiatePasswordRecovery(email);

  if (result.success) {
    window.UIManager.toast(result.message, 'success');
    window.UIManager.closeModal();
  } else {
    window.UIManager.toast(result.message, 'error');
  }
}

// Manejar envío de login
async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('login-user').value;
  const password = document.getElementById('login-pass').value;

  const result = await window.AuthManager.login(username, password);

  if (result.success) {
    window.UIManager.toast('Bienvenido', 'success');
    window.UIManager.closeModal();
    setTimeout(() => {
      const auth = window.AuthManager.getCurrentUser();
      location.href = auth.isAdmin ? 'admin.html' : 'shop.html';
    }, 1000);
  } else {
    window.UIManager.toast(result.message, 'error');
  }
}

// Manejar envío de registro
async function handleRegister(event) {
  event.preventDefault();
  const username = document.getElementById('register-user').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-pass').value;
  const passwordConfirm = document.getElementById('register-pass-confirm').value;
  const question = document.getElementById('register-question').value;
  const answer = document.getElementById('register-answer').value;

  const result = await window.AuthManager.register(username, email, password, passwordConfirm, question, answer);

  if (result.success) {
    window.UIManager.toast(result.message, 'success');
    window.UIManager.closeModal();

    // Si Supabase requiere confirmar el correo antes de poder iniciar
    // sesión, todavía no hay sesión activa: no redirigimos a la tienda.
    if (!result.needsEmailConfirmation) {
      setTimeout(() => {
        location.href = 'shop.html';
      }, 1500);
    }
  } else {
    window.UIManager.toast(result.message, 'error');
  }
}

// botón que abre el historial en pantalla aparte (si no, con muchas compras se hace largo)
function renderPurchaseHistoryButton(userId) {
  const total = window.DataManager.getOrdersByUser(userId).length;
  return `
    <button type="button" onclick="openPurchaseHistoryModal()"
            style="display:flex; align-items:center; justify-content:space-between; width:100%; padding:14px 16px; background: rgba(255,184,77,0.08); border: 1px solid #FFB84D; border-radius: 10px; color:#FFB84D; font-weight:700; cursor:pointer; font-size:0.9rem;">
      <span>Historial de Compras</span>
      <span style="display:flex; align-items:center; gap:6px; color:#a8b8cc; font-weight:400; font-size:0.8rem;">
        ${total} compra${total === 1 ? '' : 's'} &#8250;
      </span>
    </button>
  `;
}

// Pantalla aparte con el historial completo. Tiene un botón para volver a
// "Mi Perfil" sin perder el lugar.
const VENTANA_CANCELACION_GRATIS_MS = 7 * 60 * 1000; // 7 minutos

function openPurchaseHistoryModal() {
  const auth = window.AuthManager;
  const user = auth.getCurrentUser();

  const orders = window.DataManager.getOrdersByUser(user.userId)
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp);

  let listado;
  if (orders.length === 0) {
    listado = `<p style="color:#a8b8cc; font-size:0.85rem;">Todavía no tienes compras registradas.</p>`;
  } else {
    listado = orders.map(o => {
      const fecha = new Date(o.date).toLocaleDateString('es-CO');
      const metodo = o.paymentMethod === 'tienda' ? 'En tienda' : 'Tarjeta';
      const estadoColor = { pendiente: '#FFB84D', enviado: '#00D9FF', completado: '#39FF14', cancelado: '#a8b8cc' }[o.status] || '#a8b8cc';
      const puedeCancelar = o.status === 'pendiente';
      const limiteMs = o.timestamp + VENTANA_CANCELACION_GRATIS_MS;

      return `
        <div style="padding:12px 0; border-bottom:1px solid rgba(255,184,77,0.2);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div>
              <p style="color:#e8ecf1; font-size:0.9rem; font-weight:700;">Orden #${o.id} &mdash; ${fecha}</p>
              <p style="color:#a8b8cc; font-size:0.78rem;">
                ${o.items.length} artículo(s) &middot; ${metodo} &middot;
                <span style="color:${estadoColor}; font-weight:700; text-transform:capitalize;">${o.status}</span>
              </p>
            </div>
            <p style="color:#39FF14; font-weight:900;">${formatCOP(o.total)}</p>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
            <button type="button" onclick="descargarFacturaPedido(${o.id})"
                    style="padding:6px 12px; font-size:0.75rem; background:rgba(0,217,255,0.1); border:1px solid #00D9FF; color:#00D9FF; border-radius:6px; cursor:pointer; font-weight:700;">
              Descargar factura
            </button>
            ${puedeCancelar ? `<span class="cancel-timer-slot" data-order-id="${o.id}" data-limite="${limiteMs}"></span>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  const content = `
    <button type="button" onclick="openProfileModal()" style="background:none; border:none; color:#00D9FF; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; margin-bottom:16px; padding:0; font-size:0.85rem;">
      &#8249; Volver a Mi Perfil
    </button>
    <div style="max-height: 420px; overflow-y: auto;">
      ${listado}
    </div>
  `;

  window.UIManager.openModal(content, 'Historial de Compras');
  iniciarTemporizadoresCancelacion();
}

// countdown de cada pedido cancelable, se actualiza cada segundo
function iniciarTemporizadoresCancelacion() {
  if (window._cancelTimerInterval) clearInterval(window._cancelTimerInterval);

  const actualizar = () => {
    const slots = document.querySelectorAll('.cancel-timer-slot');
    if (slots.length === 0) {
      clearInterval(window._cancelTimerInterval);
      return;
    }
    slots.forEach(slot => {
      const orderId = slot.getAttribute('data-order-id');
      const limite = parseInt(slot.getAttribute('data-limite'), 10);
      const restanteMs = limite - Date.now();

      if (restanteMs > 0) {
        const min = Math.floor(restanteMs / 60000);
        const seg = Math.floor((restanteMs % 60000) / 1000);
        slot.innerHTML = `
          <button type="button" onclick="cancelarMiPedido(${orderId})"
                  style="padding:6px 12px; font-size:0.75rem; background:rgba(255,0,110,0.1); border:1px solid #FF006E; color:#FF006E; border-radius:6px; cursor:pointer; font-weight:700;">
            Cancelar pedido
          </button>
          <span style="color:#a8b8cc; font-size:0.7rem;">Gratis por ${min}:${String(seg).padStart(2, '0')} más</span>
        `;
      } else {
        slot.innerHTML = `
          <button type="button" disabled
                  style="padding:6px 12px; font-size:0.75rem; background:rgba(168,184,204,0.08); border:1px solid #6b7a90; color:#6b7a90; border-radius:6px; cursor:not-allowed; font-weight:700;">
            Cancelación gratis vencida
          </button>
          <button type="button" onclick="cancelarConFalta(${orderId})"
                  style="padding:6px 12px; font-size:0.75rem; background:rgba(255,184,77,0.1); border:1px solid #FFB84D; color:#FFB84D; border-radius:6px; cursor:pointer; font-weight:700;">
            Cancelar de todos modos (genera una falta)
          </button>
        `;
      }
    });
  };

  actualizar();
  window._cancelTimerInterval = setInterval(actualizar, 1000);
}

async function cancelarMiPedido(orderId) {
  if (!confirm('¿Cancelar este pedido? Esta acción no se puede deshacer.')) return;
  await ejecutarCancelacion(orderId, false);
}

async function cancelarConFalta(orderId) {
  if (!confirm('Ya pasaron los 7 minutos de cancelación gratuita. Si cancelas ahora, se te va a registrar una falta — a las 3 faltas quedas vetado 24 horas para jugar en la Zona de Juegos. ¿Cancelar de todos modos?')) return;
  await ejecutarCancelacion(orderId, true);
}

async function ejecutarCancelacion(orderId, conFalta) {
  try {
    const order = await window.DataManager.updateOrderStatus(orderId, 'cancelado');

    if (conFalta) {
      try {
        const resultado = await window.AuthManager.registrarStrikeCancelacion(orderId);
        if (resultado && resultado.nuevo_veto) {
          window.UIManager.toast(`Pedido cancelado. Falta ${resultado.nuevos_strikes}/3 — tu cuenta quedó vetada 24 horas.`, 'error');
        } else if (resultado) {
          window.UIManager.toast(`Pedido cancelado. Falta ${resultado.nuevos_strikes}/3 registrada.`, 'warning');
        } else {
          window.UIManager.toast('Pedido cancelado', 'success');
        }
      } catch (strikeError) {
        console.error('No se pudo registrar la falta:', strikeError);
        window.UIManager.toast('Pedido cancelado, pero no se pudo registrar la falta.', 'warning');
      }
    } else {
      window.UIManager.toast('Pedido cancelado', 'success');
    }

    // Genera y descarga el comprobante de cancelación automáticamente.
    try {
      const user = window.AuthManager.getCurrentUser();
      await generarComprobanteCancelacion(order, user);
    } catch (pdfError) {
      console.error('No se pudo generar el comprobante de cancelación:', pdfError);
    }

    openPurchaseHistoryModal();
  } catch (error) {
    window.UIManager.toast('No se pudo cancelar el pedido: ' + error.message, 'error');
  }
}

// 3 X debajo de la foto, rojas según faltas acumuladas (a las 3 = veto)
function renderStrikesIndicator(strikes) {
  const equis = [0, 1, 2].map(i => {
    const activa = i < strikes;
    return `<span style="font-weight:900; font-size:1rem; color:${activa ? '#FF006E' : 'rgba(168,184,204,0.3)'};">&#10006;</span>`;
  }).join('');
  return `
    <div style="display:flex; align-items:center; gap:6px;">
      <span style="color:#a8b8cc; font-size:0.7rem;">Faltas:</span>
      ${equis}
      <span style="color:#a8b8cc; font-size:0.7rem;">(${strikes}/3)</span>
    </div>
  `;
}

function openProfileModal() {
  const auth = window.AuthManager;
  if (!auth.isAuthenticated) {
    window.UIManager.toast('Debes iniciar sesión', 'warning');
    return;
  }
  const user = auth.getCurrentUser();
  const profile = auth.profile || {};

  const avatarPreview = profile.avatar_url
    ? `<img id="avatar-preview-img" src="${escapeHtml(profile.avatar_url)}" alt="Foto de perfil" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`
    : `<span id="avatar-preview-icon">${Icons.svg('user', { size: 40 })}</span>`;

  const content = `
    <div style="display: flex; flex-direction: column; gap: 20px;">

      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
        ${renderStrikesIndicator(profile.strikes || 0)}
        <div style="position:relative;">
          <div id="avatar-preview" data-has-avatar="${profile.avatar_url ? '1' : '0'}" onclick="toggleAvatarMenu(event)"
               style="width:130px; height:130px; border-radius:50%; background:rgba(0,217,255,0.1); border:2px solid #00D9FF; display:flex; align-items:center; justify-content:center; color:#00D9FF; cursor:pointer; overflow:hidden;">
            ${avatarPreview}
          </div>
          <div id="avatar-menu" style="display:none; position:absolute; top:100%; left:50%; transform:translateX(-50%); margin-top:8px; background:rgba(10,14,39,0.98); border:1px solid #00D9FF; border-radius:8px; box-shadow:0 0 20px rgba(0,217,255,0.4); overflow:hidden; z-index:5; white-space:nowrap;">
            <button type="button" onclick="viewAvatarImage()" style="display:block; width:100%; padding:10px 16px; background:none; border:none; color:#e8ecf1; font-size:0.8rem; text-align:left; cursor:pointer;">Ver imagen</button>
            <button type="button" onclick="closeAvatarMenu(); document.getElementById('avatar-file-input').click();" style="display:block; width:100%; padding:10px 16px; background:none; border:none; border-top:1px solid rgba(0,217,255,0.2); color:#e8ecf1; font-size:0.8rem; text-align:left; cursor:pointer;">Cambiar imagen</button>
          </div>
        </div>
        <input type="file" id="avatar-file-input" accept="image/*" style="display:none;" onchange="handleAvatarUpload(this.files[0])">
        <p style="color:#a8b8cc; font-size:0.75rem;">Toca la foto para cambiarla (máx. 2 MB)</p>
      </div>

      ${auth.isBanned() ? `
        <div style="background: rgba(255,0,110,0.1); border: 1px solid #FF006E; border-radius: 10px; padding: 14px; text-align:center;">
          <p style="color:#FF006E; font-weight:700; font-size:0.85rem;">${escapeHtml(auth.getBanMessage())}</p>
        </div>
      ` : ''}

      <div style="background: rgba(0,217,255,0.08); border: 1px solid #00D9FF; border-radius: 10px; padding: 18px;">
        <p style="margin-bottom: 8px;"><strong style="color:#00D9FF;">Email:</strong> ${escapeHtml(user.email)}</p>
        <p style="margin-bottom: 8px;"><strong style="color:#00D9FF;">Rol:</strong> ${user.isAdmin ? 'Administrador' : 'Cliente'}</p>
        ${!user.isAdmin ? `<p><strong style="color:#00D9FF;">Créditos:</strong> ${profile.credits ?? 0}</p>` : ''}
      </div>

      ${renderPurchaseHistoryButton(user.userId)}

      <form onsubmit="handleUpdateProfile(event)" style="display: flex; flex-direction: column; gap: 10px;">
        <p style="color: #00D9FF; font-weight: 700;">Datos generales</p>

        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label style="color: #a8b8cc; font-size: 0.8rem;">Nombre de usuario</label>
          <input type="text" id="profile-username" value="${escapeHtml(profile.username || '')}" required
                 style="padding: 10px; background: rgba(15, 24, 41, 0.8); border: 1px solid #00D9FF; color: #e8ecf1; border-radius: 6px;">
        </div>

        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label style="color: #a8b8cc; font-size: 0.8rem;">Nombre completo</label>
          <input type="text" id="profile-fullname" value="${escapeHtml(profile.full_name || '')}" placeholder="Tu nombre completo"
                 style="padding: 10px; background: rgba(15, 24, 41, 0.8); border: 1px solid #00D9FF; color: #e8ecf1; border-radius: 6px;">
        </div>

        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label style="color: #a8b8cc; font-size: 0.8rem;">Teléfono</label>
          <input type="tel" id="profile-phone" value="${escapeHtml(profile.phone || '')}" placeholder="Tu número de contacto"
                 maxlength="10" inputmode="numeric" oninput="this.value = this.value.replace(/[^0-9]/g, '')"
                 style="padding: 10px; background: rgba(15, 24, 41, 0.8); border: 1px solid #00D9FF; color: #e8ecf1; border-radius: 6px;">
        </div>

        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label style="color: #a8b8cc; font-size: 0.8rem;">Dirección de envío</label>
          <input type="text" id="profile-address" value="${escapeHtml(profile.address || '')}" placeholder="Tu dirección"
                 style="padding: 10px; background: rgba(15, 24, 41, 0.8); border: 1px solid #00D9FF; color: #e8ecf1; border-radius: 6px;">
        </div>

        <label style="display:flex; align-items:flex-start; gap:10px; padding:10px 12px; background:rgba(0,217,255,0.06); border:1px solid #00D9FF; border-radius:8px; cursor:pointer;">
          <input type="checkbox" id="profile-notificar-pedidos" ${profile.notificar_pedidos !== false ? 'checked' : ''}
                 style="margin-top:2px; width:16px; height:16px; accent-color:#00D9FF; cursor:pointer;">
          <span style="color:#a8b8cc; font-size:0.78rem;">Recibir un correo cuando cambie el estado de mis pedidos (ej. enviado)</span>
        </label>

        <button type="submit" class="btn" style="width: 100%; padding: 12px; margin-top: 4px;">Guardar Datos</button>
      </form>

      <form onsubmit="handleChangePassword(event)" style="display: flex; flex-direction: column; gap: 8px;">
        <p style="color: #FF006E; font-weight: 700;">Cambiar contraseña</p>
        ${passwordFieldWrapper(`<input type="password" id="profile-current-pass" placeholder="Contraseña actual" required
               style="padding: 10px; background: rgba(15, 24, 41, 0.8); border: 1px solid #00D9FF; color: #e8ecf1; border-radius: 6px;">`, 'profile-current-pass')}
        ${passwordFieldWrapper(`<input type="password" id="profile-new-pass" placeholder="Nueva contraseña (mín. 6 caracteres)" required
               oninput="PasswordValidation.checkStrength('profile-new-pass', 'profile-pass-hint')"
               style="padding: 10px; background: rgba(15, 24, 41, 0.8); border: 1px solid #00D9FF; color: #e8ecf1; border-radius: 6px;">`, 'profile-new-pass')}
        <p id="profile-pass-hint" class="field-hint"></p>
        ${passwordFieldWrapper(`<input type="password" id="profile-confirm-pass" placeholder="Confirmar nueva contraseña" required
               oninput="PasswordValidation.checkMatch('profile-new-pass', 'profile-confirm-pass', 'profile-match-hint')"
               style="padding: 10px; background: rgba(15, 24, 41, 0.8); border: 1px solid #00D9FF; color: #e8ecf1; border-radius: 6px;">`, 'profile-confirm-pass')}
        <p id="profile-match-hint" class="field-hint"></p>
        <button type="submit" class="btn" style="width: 100%; padding: 12px; margin-top: 4px;">Actualizar Contraseña</button>
      </form>
    </div>
  `;

  window.UIManager.openModal(content, '<span class="title-cycle-color">Mi Perfil</span>');
}

async function handleUpdateProfile(event) {
  event.preventDefault();
  const username = document.getElementById('profile-username').value.trim();
  const full_name = document.getElementById('profile-fullname').value.trim();
  const phone = document.getElementById('profile-phone').value.trim();
  const address = document.getElementById('profile-address').value.trim();
  const notificar_pedidos = document.getElementById('profile-notificar-pedidos').checked;

  if (phone && !/^\d{10}$/.test(phone)) {
    window.UIManager.toast('El teléfono debe tener exactamente 10 dígitos', 'error');
    return;
  }

  const result = await window.AuthManager.updateOwnProfile({ username, full_name, phone, address, notificar_pedidos });

  if (result.success) {
    window.UIManager.toast(result.message, 'success');
    window.UIManager.updateUIByRole();
  } else {
    window.UIManager.toast(result.message, 'error');
  }
}

// Menú de "Ver imagen" / "Cambiar imagen" al tocar la foto de perfil. Si
// todavía no hay foto, no tiene sentido mostrar "Ver imagen": abre
// directamente el selector de archivos, igual que antes.
function toggleAvatarMenu(event) {
  event.stopPropagation();
  const avatarEl = document.getElementById('avatar-preview');
  if (avatarEl && avatarEl.getAttribute('data-has-avatar') !== '1') {
    document.getElementById('avatar-file-input').click();
    return;
  }
  const menu = document.getElementById('avatar-menu');
  if (!menu) return;
  const abierto = menu.style.display === 'block';
  menu.style.display = abierto ? 'none' : 'block';
  if (!abierto) {
    // Cierra el menú si se hace click en cualquier otro lado
    setTimeout(() => {
      document.addEventListener('click', closeAvatarMenuOnClickOutside);
    }, 0);
  }
}

function closeAvatarMenuOnClickOutside() {
  closeAvatarMenu();
  document.removeEventListener('click', closeAvatarMenuOnClickOutside);
}

function closeAvatarMenu() {
  const menu = document.getElementById('avatar-menu');
  if (menu) menu.style.display = 'none';
}

// Muestra la foto de perfil en grande, en su propia capa flotante encima
// del modal "Mi Perfil" (sin cerrar ese modal, ya que UIManager solo
// soporta un modal a la vez).
// Muestra cualquier foto de perfil en grande, en una capa flotante encima
// de todo (sin cerrar ningún modal que esté abierto detrás).
function mostrarImagenEnGrande(src) {
  if (!src) return;

  const overlay = document.createElement('div');
  overlay.id = 'avatar-lightbox';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.9); z-index: 10001;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(5px);
  `;
  overlay.innerHTML = `
    <button type="button" onclick="document.getElementById('avatar-lightbox').remove()"
            style="position:absolute; top:20px; right:30px; background:none; border:none; color:#FF006E; font-size:32px; cursor:pointer; line-height:1;">&times;</button>
    <img src="${src}" alt="Foto de perfil" style="max-width:90vw; max-height:85vh; border-radius:12px; border:2px solid #00D9FF; box-shadow:0 0 40px rgba(0,217,255,0.5);">
  `;
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
}

function viewNavbarAvatar(event, src) {
  event.stopPropagation();
  mostrarImagenEnGrande(src);
}

function viewAvatarImage() {
  closeAvatarMenu();
  const img = document.getElementById('avatar-preview-img');
  if (!img || !img.src) {
    window.UIManager.toast('Todavía no tienes una foto de perfil', 'warning');
    return;
  }
  mostrarImagenEnGrande(img.src);
}

async function handleAvatarUpload(file) {
  if (!file) return;

  window.UIManager.toast('Subiendo foto...', 'info');
  const result = await window.AuthManager.uploadAvatar(file);

  if (result.success) {
    window.UIManager.toast('Foto de perfil actualizada', 'success');
    const preview = document.getElementById('avatar-preview');
    if (preview) {
      preview.setAttribute('data-has-avatar', '1');
      preview.innerHTML = `<img id="avatar-preview-img" src="${escapeHtml(result.avatarUrl)}" alt="Foto de perfil" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
    }
    window.UIManager.updateNavbar();
  } else {
    window.UIManager.toast(result.message, 'error');
  }
}

async function handleChangePassword(event) {
  event.preventDefault();
  const auth = window.AuthManager;
  const currentPassword = document.getElementById('profile-current-pass').value;
  const newPassword = document.getElementById('profile-new-pass').value;
  const confirmPassword = document.getElementById('profile-confirm-pass').value;

  const result = await auth.changeOwnPassword(currentPassword, newPassword, confirmPassword);

  if (result.success) {
    window.UIManager.toast(result.message, 'success');
    window.UIManager.closeModal();
  } else {
    window.UIManager.toast(result.message, 'error');
  }
}

// Logout (disponible globalmente en todas las páginas)
async function logout() {
  await window.AuthManager.logout();
  window.UIManager.toast('Sesión cerrada', 'info');
  setTimeout(() => {
    location.href = 'index.html';
  }, 500);
}

