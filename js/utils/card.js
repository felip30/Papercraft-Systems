/**
 * TARJETA (pago simulado) - PaperCraft Systems
 * Formateo y validación compartidos por el pago real del carrito
 * (cart.html) y el formulario de vista previa del inicio (index.html).
 */

// "4111111111111111" -> "4111 1111 1111 1111"
function formatCardNumberInput(input) {
  const digits = input.value.replace(/\D/g, '').slice(0, 16);
  input.value = digits.replace(/(.{4})/g, '$1 ').trim();
}

// "1228" -> "12/28"
function formatCardExpiryInput(input) {
  let digits = input.value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) digits = digits.slice(0, 2) + '/' + digits.slice(2);
  input.value = digits;
}

// Lee los 4 campos usando el prefijo de sus ids ("card" -> card-name, ...).
function leerCamposTarjeta(prefijo) {
  const valor = (campo) => document.getElementById(`${prefijo}-${campo}`).value;
  return {
    nombre: valor('name').trim(),
    numero: valor('number').replace(/\s/g, ''),
    vencimiento: valor('expiry').trim(),
    cvv: valor('cvv').trim()
  };
}

// Revisa que la fecha MM/AA tenga un mes válido y no esté vencida.
function _errorDeVencimiento(mes, anioCorto) {
  const anio = 2000 + anioCorto;
  if (mes < 1 || mes > 12) return 'El mes de vencimiento no es válido';
  const expiraFin = new Date(anio, mes, 0); // último día del mes de vencimiento
  if (expiraFin < new Date()) return 'La tarjeta está vencida';
  return null;
}

/**
 * Devuelve el mensaje de error a mostrar, o null si todo está bien.
 * opciones.revisarVencimiento: además del formato MM/AA, valida el mes y
 * que la tarjeta no esté vencida (lo usa el pago real del carrito).
 */
function validarTarjeta({ nombre, numero, vencimiento, cvv }, opciones = {}) {
  // Lista por nombre los campos faltantes, igual que en el registro.
  const faltantes = [];
  if (!nombre) faltantes.push('Nombre en la tarjeta');
  if (!numero) faltantes.push('Número de tarjeta');
  if (!vencimiento) faltantes.push('Vencimiento');
  if (!cvv) faltantes.push('CVV');
  if (faltantes.length > 0) return `Falta completar: ${faltantes.join(', ')}`;

  if (!/^\d{13,16}$/.test(numero)) return 'El número de tarjeta no es válido';

  const expiryMatch = /^(\d{2})\/(\d{2})$/.exec(vencimiento);
  if (!expiryMatch) return 'El vencimiento debe tener el formato MM/AA';

  if (opciones.revisarVencimiento) {
    const error = _errorDeVencimiento(parseInt(expiryMatch[1], 10), parseInt(expiryMatch[2], 10));
    if (error) return error;
  }

  if (!/^\d{3,4}$/.test(cvv)) return 'El CVV no es válido';
  return null;
}
