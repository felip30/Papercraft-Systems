/**
 * FACTURA EN PDF - PaperCraft Systems
 *
 * Compartido entre todas las páginas (no solo el carrito), porque "Mi
 * Perfil" — desde donde también se puede descargar la factura de un
 * pedido anterior — se abre desde cualquier lugar del sitio.
 *
 * Requiere que la librería jsPDF ya esté cargada:
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
 *   <script src="js/invoice.js"></script>
 */

// Convierte una imagen (PNG/JPEG) ya existente en un archivo del proyecto
// a un data URL en memoria, que es lo que jsPDF necesita para poder
// incrustarla en el PDF.
function imageToDataUrl(path) {
  return fetch(path)
    .then(res => res.blob())
    .then(blob => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }));
}

// Convierte el ícono SVG del zorro (favicon) a una imagen PNG en memoria,
// porque jsPDF no puede dibujar SVG directamente — necesita un formato de
// imagen tipo PNG/JPEG.
function svgToPngDataUrl(svgPath, size) {
  return new Promise((resolve, reject) => {
    fetch(svgPath)
      .then(res => res.text())
      .then(svgText => {
        const blob = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, size, size);
          URL.revokeObjectURL(url);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = url;
      })
      .catch(reject);
  });
}

async function generarFacturaPDF(order, user) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = 20;

  // Logo del zorro + nombre de la tienda
  try {
    const logoDataUrl = await svgToPngDataUrl('assets/favicon.svg', 128);
    doc.addImage(logoDataUrl, 'PNG', margin, y - 6, 16, 16);
  } catch (e) {
    console.warn('No se pudo cargar el logo para la factura:', e);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 30);
  doc.text('PaperCraft Systems', margin + 20, y);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 110);
  doc.text('Diseña, Construye, Domina', margin + 20, y + 6);

  doc.setDrawColor(200, 200, 210);
  y += 16;
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Datos de la factura
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 30);
  doc.text(`Factura de pago — Orden #${order.id}`, margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 70);
  const fecha = new Date(order.date || Date.now()).toLocaleString('es-CO');
  const metodoTexto = order.paymentMethod === 'tienda' ? 'Pago en tienda (sin tarjeta)' : 'Tarjeta';
  doc.text(`Fecha: ${fecha}`, margin, y); y += 6;
  doc.text(`Cliente: ${user.username}`, margin, y); y += 6;
  doc.text(`Email: ${user.email}`, margin, y); y += 6;
  doc.text(`Método de pago: ${metodoTexto}`, margin, y); y += 6;
  doc.text(`Estado del pedido: ${(order.status || '').toUpperCase()}`, margin, y); y += 10;

  // Código de recogida en tienda: solo si el pedido se hizo con la opción
  // "Recoger en tienda" activa (identificable porque no se cobró envío).
  // Si el pedido sí tuvo envío (independiente del método de pago), esta
  // caja no aplica y se omite.
  if (order.shipping === 0) {
    const codigoRecogida = `PC-${String(order.id).padStart(6, '0')}`;
    doc.setDrawColor(0, 180, 205);
    doc.setFillColor(230, 250, 253);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 18, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 130, 150);
    doc.text('CÓDIGO PARA RECOGER EN TIENDA', margin + 5, y + 7);
    doc.setFontSize(15);
    doc.setTextColor(20, 20, 30);
    doc.text(codigoRecogida, margin + 5, y + 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 90);
    doc.text('Presenta este código al recoger tu pedido', pageWidth - margin - 5, y + 11, { align: 'right' });
    y += 26;
  } else {
    y += 6;
  }

  // Tabla de productos (dibujada a mano, sin plugins externos)
  const colProducto = margin;
  const colCant = pageWidth - margin - 62;
  const colPrecio = pageWidth - margin - 40;
  const colSubtotal = pageWidth - margin;

  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 245);
  doc.rect(margin, y - 5, pageWidth - margin * 2, 8, 'F');
  doc.text('Producto', colProducto + 2, y);
  doc.text('Cant.', colCant, y, { align: 'right' });
  doc.text('Precio', colPrecio, y, { align: 'right' });
  doc.text('Subtotal', colSubtotal, y, { align: 'right' });
  y += 8;

  doc.setFont('helvetica', 'normal');
  (order.items || []).forEach(item => {
    const subtotalItem = item.price * item.quantity;
    doc.text(String(item.name).slice(0, 38), colProducto + 2, y);
    doc.text(String(item.quantity), colCant, y, { align: 'right' });
    doc.text(formatCOP(item.price), colPrecio, y, { align: 'right' });
    doc.text(formatCOP(subtotalItem), colSubtotal, y, { align: 'right' });
    y += 7;
  });

  y += 3;
  doc.setDrawColor(220, 220, 230);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Totales
  const totalLine = (label, value, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 12 : 10);
    doc.text(label, colPrecio - 20, y);
    doc.text(value, colSubtotal, y, { align: 'right' });
    y += bold ? 8 : 6;
  };

  doc.setTextColor(60, 60, 70);
  totalLine('Subtotal', formatCOP(order.subtotal));
  totalLine('IVA (19%)', formatCOP(order.tax));
  totalLine('Envío', formatCOP(order.shipping));
  if (order.discount > 0) {
    doc.setTextColor(230, 130, 0);
    totalLine('Descuento aplicado', `-${formatCOP(order.discount)}`);
    doc.setTextColor(60, 60, 70);
  }
  doc.setTextColor(20, 140, 60);
  totalLine('TOTAL', formatCOP(order.total), true);

  // Código QR: imagen fija (no se genera cada vez), apunta al sitio de
  // PaperCraft Systems en Vercel.
  try {
    const qrDataUrl = await imageToDataUrl('assets/qr-tienda.png');
    const qrSize = 28;
    const qrX = pageWidth - margin - qrSize;
    const qrY = 250;
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    doc.setTextColor(140, 140, 150);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Escanea para visitar PaperCraft Systems', qrX + qrSize / 2, qrY + qrSize + 4, { align: 'center' });
  } catch (e) {
    console.error('No se pudo agregar el código QR a la factura:', e);
    if (window.UIManager) window.UIManager.toast('No se pudo agregar el código QR a la factura: ' + e.message, 'warning');
  }

  // Pie de página
  doc.setTextColor(140, 140, 150);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.text('Gracias por tu compra en PaperCraft Systems.', margin, 280);

  doc.save(`factura-orden-${order.id}.pdf`);
}

// Descarga la factura de un pedido puntual — se usa desde "Mi Perfil" →
// Historial de Compras, en cualquier página del sitio.
async function descargarFacturaPedido(orderId) {
  const order = window.DataManager.getOrderById(orderId);
  if (!order) {
    if (window.UIManager) window.UIManager.toast('No se encontró el pedido', 'error');
    return;
  }
  const user = window.AuthManager.getCurrentUser();
  try {
    await generarFacturaPDF(order, user);
  } catch (error) {
    console.error('No se pudo generar la factura:', error);
    if (window.UIManager) window.UIManager.toast('No se pudo generar la factura: ' + error.message, 'error');
  }
}

// Comprobante de cancelación: se genera automáticamente apenas un
// cliente cancela su propio pedido, y también se puede volver a
// descargar desde el Panel Admin (sub-sección de cancelaciones en
// Historial de Pedidos).
async function generarComprobanteCancelacion(order, user) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = 20;

  try {
    const logoDataUrl = await svgToPngDataUrl('assets/favicon.svg', 128);
    doc.addImage(logoDataUrl, 'PNG', margin, y - 6, 16, 16);
  } catch (e) {
    console.warn('No se pudo cargar el logo para el comprobante:', e);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 30);
  doc.text('PaperCraft Systems', margin + 20, y);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 110);
  doc.text('Diseña, Construye, Domina', margin + 20, y + 6);

  doc.setDrawColor(200, 200, 210);
  y += 16;
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // Encabezado del comprobante, destacado en rojo/rosa para diferenciarlo
  // claramente de una factura normal.
  doc.setFillColor(255, 235, 240);
  doc.setDrawColor(255, 0, 110);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 16, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(200, 0, 90);
  doc.text('COMPROBANTE DE CANCELACIÓN DE PEDIDO', pageWidth / 2, y + 10, { align: 'center' });
  y += 26;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 30);
  doc.text(`Orden #${order.id}`, margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 70);
  const fechaCompra = new Date(order.date || Date.now()).toLocaleString('es-CO');
  const fechaCancelacion = new Date(order.updatedAt || Date.now()).toLocaleString('es-CO');
  doc.text(`Cliente: ${user.username}`, margin, y); y += 6;
  doc.text(`Email: ${user.email}`, margin, y); y += 6;
  doc.text(`Fecha de la compra: ${fechaCompra}`, margin, y); y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 0, 90);
  doc.text(`Fecha y hora de cancelación: ${fechaCancelacion}`, margin, y); y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 70);

  // Tabla de productos cancelados
  const colProducto = margin;
  const colCant = pageWidth - margin - 62;
  const colPrecio = pageWidth - margin - 40;
  const colSubtotal = pageWidth - margin;

  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 245);
  doc.rect(margin, y - 5, pageWidth - margin * 2, 8, 'F');
  doc.text('Producto cancelado', colProducto + 2, y);
  doc.text('Cant.', colCant, y, { align: 'right' });
  doc.text('Precio', colPrecio, y, { align: 'right' });
  doc.text('Subtotal', colSubtotal, y, { align: 'right' });
  y += 8;

  doc.setFont('helvetica', 'normal');
  (order.items || []).forEach(item => {
    const subtotalItem = item.price * item.quantity;
    doc.text(String(item.name).slice(0, 36), colProducto + 2, y);
    doc.text(String(item.quantity), colCant, y, { align: 'right' });
    doc.text(formatCOP(item.price), colPrecio, y, { align: 'right' });
    doc.text(formatCOP(subtotalItem), colSubtotal, y, { align: 'right' });
    y += 7;
  });

  y += 5;
  doc.setDrawColor(220, 220, 230);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(200, 0, 90);
  doc.text('TOTAL CANCELADO', colPrecio - 20, y);
  doc.text(formatCOP(order.total), colSubtotal, y, { align: 'right' });
  y += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 90);
  doc.text('El stock de los productos cancelados fue devuelto automáticamente al inventario.', margin, y);

  doc.setTextColor(140, 140, 150);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.text('PaperCraft Systems — Este documento certifica la cancelación del pedido indicado.', margin, 280);

  doc.save(`cancelacion-orden-${order.id}.pdf`);
}

// Genera y descarga el comprobante de cancelación de un pedido específico
// — se usa desde el Panel Admin (sub-sección de cancelaciones).
async function descargarComprobanteCancelacion(orderId) {
  const order = window.DataManager.getOrderById(orderId);
  if (!order) {
    if (window.UIManager) window.UIManager.toast('No se encontró el pedido', 'error');
    return;
  }
  // El admin necesita los datos del cliente dueño del pedido, no los
  // propios — se buscan en la caché de usuarios que ya carga la pestaña
  // "Usuarios" del panel; si no está disponible, se usa lo que ya trae
  // el propio pedido (nombre) como respaldo.
  const usuarioCache = (window._adminUsersCache || []).find(u => u.id === order.userId);
  const user = {
    username: order.userName,
    email: usuarioCache ? usuarioCache.email : 'No disponible'
  };
  try {
    await generarComprobanteCancelacion(order, user);
  } catch (error) {
    console.error('No se pudo generar el comprobante de cancelación:', error);
    if (window.UIManager) window.UIManager.toast('No se pudo generar el comprobante: ' + error.message, 'error');
  }
}
