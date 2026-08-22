/**
 * reset-password.js
 *
 * Esta página se abre cuando alguien da clic en el enlace que le llega
 * por correo al pedir "Recuperar Contraseña". Supabase agrega a la URL
 * un token de recuperación y, al cargar el SDK, dispara automáticamente
 * el evento "PASSWORD_RECOVERY" con una sesión temporal válida solo para
 * cambiar la contraseña (no es un login normal).
 */

let recoverySessionLista = false;

function mostrarEstado(mensaje, tipo) {
  const el = document.getElementById('reset-status');
  el.textContent = mensaje;
  el.className = `reset-status show ${tipo}`;
}

function mostrarFormulario() {
  recoverySessionLista = true;
  document.getElementById('reset-subtitle').textContent =
    'Escribe tu nueva contraseña para terminar de recuperar tu cuenta.';
  document.getElementById('reset-form').style.display = 'flex';
}

function mostrarEnlaceInvalido() {
  document.getElementById('reset-title').textContent = 'Enlace no válido';
  document.getElementById('reset-subtitle').textContent =
    'Este enlace de recuperación ya expiró o no es válido. Pide uno nuevo desde el inicio de sesión.';
  mostrarEstado('No encontramos una recuperación de contraseña activa para este enlace.', 'error');
}

// Si el token viene con error (por ejemplo, enlace ya usado o vencido),
// Supabase lo manda como parámetros en el hash de la URL en vez de
// disparar PASSWORD_RECOVERY.
function tieneErrorEnUrl() {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  const params = new URLSearchParams(hash || window.location.search);
  return params.get('error') || params.get('error_description');
}

window.addEventListener('DOMContentLoaded', () => {
  if (tieneErrorEnUrl()) {
    mostrarEnlaceInvalido();
    return;
  }

  window.supabaseClient.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      mostrarFormulario();
    }
  });

  // Si el evento ya se disparó antes de registrar el listener (puede pasar
  // según el timing de carga), revisamos si ya quedó una sesión activa.
  setTimeout(async () => {
    if (recoverySessionLista) return;
    const { data } = await window.supabaseClient.auth.getSession();
    if (data.session) {
      mostrarFormulario();
    } else {
      mostrarEnlaceInvalido();
    }
  }, 2500);
});

async function handleResetSubmit(event) {
  event.preventDefault();

  const nueva = document.getElementById('new-password').value;
  const confirmar = document.getElementById('confirm-password').value;

  if (nueva.length < 6) {
    mostrarEstado('La contraseña debe tener mínimo 6 caracteres', 'error');
    return;
  }
  if (nueva !== confirmar) {
    mostrarEstado('Las contraseñas no coinciden', 'error');
    return;
  }

  const boton = event.target.querySelector('button[type="submit"]');
  boton.disabled = true;
  boton.textContent = 'Guardando...';

  const { error } = await window.supabaseClient.auth.updateUser({ password: nueva });

  if (error) {
    mostrarEstado(error.message, 'error');
    boton.disabled = false;
    boton.textContent = 'Guardar nueva contraseña';
    return;
  }

  document.getElementById('reset-form').style.display = 'none';
  document.getElementById('reset-title').textContent = '¡Contraseña actualizada!';
  document.getElementById('reset-subtitle').textContent =
    'Ya puedes iniciar sesión con tu nueva contraseña.';
  mostrarEstado('Contraseña actualizada exitosamente', 'success');

  // Cierra la sesión temporal de recuperación para que el usuario inicie
  // sesión normal con su contraseña nueva.
  await window.supabaseClient.auth.signOut();

  setTimeout(() => {
    window.location.href = '../index.html';
  }, 2500);
}
