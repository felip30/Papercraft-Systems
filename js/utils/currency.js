/**
 * CURRENCY - PaperCraft Systems
 * Utilidad para mostrar todos los valores monetarios en pesos colombianos
 * (COP): separador de miles con punto y sin decimales, como se usa en
 * Colombia (ej. $52.000).
 */

function formatCOP(amount) {
  const value = Math.round(Number(amount) || 0);
  return '$' + value.toLocaleString('es-CO');
}

window.formatCOP = formatCOP;
