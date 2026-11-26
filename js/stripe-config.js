/**
 * STRIPE CONFIGURATION
 * Integración de Stripe para procesamiento de pagos
 */

// ════════════════════════════════════════════════════════════════
// VARIABLES DE CONFIGURACIÓN
// ════════════════════════════════════════════════════════════════

const STRIPE_PUBLIC_KEY = 'pk_test_51234567890abcdefghijklmnop'; // Reemplaza con tu clave pública de Stripe
let stripe;
let elements;
let cardElement;

// ════════════════════════════════════════════════════════════════
// INICIALIZAR STRIPE
// ════════════════════════════════════════════════════════════════

function initializeStripe() {
  try {
    // Crear instancia de Stripe
    stripe = Stripe(STRIPE_PUBLIC_KEY);

    // Crear elementos de Stripe
    elements = stripe.elements();
    cardElement = elements.create('card');

    // Montar card element en el DOM
    if (document.getElementById('card-element')) {
      cardElement.mount('#card-element');

      // Manejar cambios en el card element
      cardElement.addEventListener('change', handleCardChange);
    }

    console.log(' Stripe inicializado correctamente');
  } catch (error) {
    console.error(' Error al inicializar Stripe:', error);
  }
}

// ════════════════════════════════════════════════════════════════
// MANEJADORES DE EVENTOS
// ════════════════════════════════════════════════════════════════

function handleCardChange(event) {
  const errorDiv = document.getElementById('card-errors');
  
  if (event.error) {
    errorDiv.textContent = event.error.message;
    errorDiv.style.color = '#dc2626';
  } else {
    errorDiv.textContent = '';
  }
}

// ════════════════════════════════════════════════════════════════
// CREAR TOKEN DE PAGO
// ════════════════════════════════════════════════════════════════

async function createPaymentToken(cardholderName) {
  try {
    const result = await stripe.createToken(cardElement, {
      name: cardholderName
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.token;
  } catch (error) {
    console.error('Error al crear token:', error);
    throw error;
  }
}

// ════════════════════════════════════════════════════════════════
// CREAR PAYMENT INTENT (Para pagos más seguros)
// ════════════════════════════════════════════════════════════════

async function createPaymentIntent(amount, currency = 'usd', metadata = {}) {
  try {
    // Llamar a tu servidor para crear Payment Intent
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Stripe usa centavos
        currency,
        metadata
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data.clientSecret;
  } catch (error) {
    console.error('Error al crear Payment Intent:', error);
    throw error;
  }
}

// ════════════════════════════════════════════════════════════════
// PROCESAR PAGO
// ════════════════════════════════════════════════════════════════

async function processPayment(clientSecret) {
  try {
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: document.getElementById('cardName').value
        }
      }
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.paymentIntent;
  } catch (error) {
    console.error('Error al procesar pago:', error);
    throw error;
  }
}

// ════════════════════════════════════════════════════════════════
// FUNCIONES DE UTILIDAD
// ════════════════════════════════════════════════════════════════

function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

function validateCardholderName(name) {
  return name && name.trim().length > 2;
}

function validateCardElement() {
  // Stripe maneja la validación automáticamente
  return !cardElement._state.error;
}

// ════════════════════════════════════════════════════════════════
// MANEJO DE ERRORES DE PAGO
// ════════════════════════════════════════════════════════════════

function handlePaymentError(error) {
  const errorDiv = document.getElementById('card-errors');
  
  if (errorDiv) {
    errorDiv.textContent = `Error de pago: ${error.message}`;
    errorDiv.style.color = '#dc2626';
  }

  console.error('Error de pago:', error);
}

// ════════════════════════════════════════════════════════════════
// WEBHOOK HANDLERS (en tu servidor)
// ════════════════════════════════════════════════════════════════

// Los webhooks de Stripe (pago exitoso, pago fallido, reembolso) se
// atienden en un servidor, nunca en el navegador: allí se verifica la firma
// con stripe.webhooks.constructEvent() usando STRIPE_WEBHOOK_SECRET y se
// actualiza el pedido. Guía oficial: https://docs.stripe.com/webhooks

// ════════════════════════════════════════════════════════════════
// VARIABLES GLOBALES
// ════════════════════════════════════════════════════════════════

window.StripeManager = {
  initializeStripe,
  createPaymentToken,
  createPaymentIntent,
  processPayment,
  formatCurrency,
  validateCardholderName,
  validateCardElement,
  handlePaymentError
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeStripe);
} else {
  initializeStripe();
}
