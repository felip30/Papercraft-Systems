/**
 * FORMULARIO DE PRODUCTO COMPARTIDO - PaperCraft Systems
 * Lo usan la Tienda (shop.html, botones de admin sobre cada tarjeta) y el
 * Panel Admin (admin.html, pestaña Inventario) para agregar y editar
 * productos. Todo texto que viene de la base de datos se escapa con
 * escapeHtml() (js/ui.js) antes de meterlo en el HTML.
 */

const PRODUCT_ICON_OPTIONS = [
  ['package', 'Paquete'],
  ['notebook', 'Cuaderno'],
  ['book', 'Libro'],
  ['palette', 'Paleta'],
  ['document', 'Documento'],
  ['gamepad', 'Tecnología'],
  ['target', 'Precisión'],
  ['bell', 'Audio'],
  ['gift', 'Regalo'],
  ['star', 'Destacado']
];

const PRODUCT_CATEGORY_OPTIONS = [
  ['papelería', 'Papelería'],
  ['tecnología', 'Tecnología']
];

function _productFieldStyle(color) {
  return `padding: 10px; background: rgba(15, 24, 41, 0.8); border: 1px solid ${color}; color: #e8ecf1; border-radius: 6px;`;
}

function _productField(color, label, control) {
  return `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <label style="color: ${color}; font-weight: 700;">${label}</label>
          ${control}
        </div>`;
}

function _productOptions(opciones, seleccionado) {
  return opciones.map(([valor, texto]) =>
    `<option value="${escapeHtml(valor)}" ${valor === seleccionado ? 'selected' : ''}>${texto}</option>`
  ).join('');
}

/**
 * Arma el HTML del formulario.
 * config = {
 *   prefijo:    prefijo de los ids de los campos ("new-producto", "edit-prod", ...)
 *   color:      color neón de etiquetas y bordes
 *   onSubmit:   código del atributo onsubmit (ej. "handleAddProduct(event)")
 *   producto:   producto a editar (omitir para un formulario vacío)
 *   conIcono:   muestra el selector de ícono
 *   etiquetaNombre, textoBoton, notaImagen, estiloBoton: textos/estilos de cada pantalla
 * }
 */
function buildProductForm(config) {
  const {
    prefijo, color, onSubmit, producto = null, conIcono = true,
    etiquetaNombre = 'Nombre', textoBoton = 'Guardar Cambios',
    notaImagen = 'Si la dejas vacía, se muestra el ícono en la tienda.',
    estiloBoton = 'width: 100%; padding: 12px;'
  } = config;
  const p = producto || {};
  const estilo = _productFieldStyle(color);
  const valor = (v) => (producto ? `value="${escapeHtml(v ?? '')}"` : '');
  const imagen = p.imagen || '';
  const id = (campo) => `${prefijo}-${campo}`;
  const imagenSrc = imagen ? 'src="' + escapeHtml(imagen) + '"' : '';

  const campos = [
    _productField(color, etiquetaNombre,
      `<input type="text" id="${id('nombre')}" ${valor(p.nombre)} ${producto ? '' : 'placeholder="Ej: Teclado Mecánico RGB"'} required
                 style="${estilo}">`),
    _productField(color, 'Categoría',
      `<select id="${id('categoria')}" required style="${estilo}">
            ${_productOptions(PRODUCT_CATEGORY_OPTIONS, p.categoria)}
          </select>`),
    _productField(color, 'Precio',
      `<input type="number" id="${id('precio')}" ${valor(p.precio)} ${producto ? '' : 'placeholder="52000"'} step="1000" required
                 style="${estilo}">`),
    _productField(color, 'Descripción',
      `<textarea id="${id('descripcion')}" rows="3" placeholder="Descripción del producto (se muestra en la tienda)"
                    style="${estilo} font-family: inherit; resize: vertical;">${escapeHtml(p.description || '')}</textarea>`),
    _productField(color, 'Stock',
      `<input type="number" id="${id('stock')}" ${valor(p.stock)} ${producto ? '' : 'placeholder="50"'} required
                 style="${estilo}">`),
    _productField(color, 'URL de imagen (opcional)',
      `<input type="text" id="${id('imagen')}" ${valor(imagen)} placeholder="https://..."
                 oninput="previewProductoImagen('${id('imagen-preview')}', this.value)"
                 style="${estilo}">
          <p style="color:#6b7a90; font-size:0.72rem;">${notaImagen}</p>
          <img id="${id('imagen-preview')}" ${imagenSrc} style="max-width:100%; max-height:120px; border-radius:8px; ${imagen ? '' : 'display:none;'}" onerror="this.style.display='none';" onload="this.style.display='block';">`)
  ];

  if (conIcono) {
    campos.push(_productField(color, 'Icono',
      `<select id="${id('icon')}" style="${estilo}">
            ${_productOptions(PRODUCT_ICON_OPTIONS, p.icon)}
          </select>`));
  }

  return `
      <form onsubmit="${onSubmit}" style="display: flex; flex-direction: column; gap: 15px;">
        ${campos.join('')}
        <button type="submit" class="btn" style="${estiloBoton}">${textoBoton}</button>
      </form>
    `;
}

// Lee los campos de un formulario armado con buildProductForm().
function readProductForm(prefijo, conIcono = true) {
  const campo = (nombre) => document.getElementById(`${prefijo}-${nombre}`);
  const datos = {
    nombre: campo('nombre').value,
    categoria: campo('categoria').value,
    precio: campo('precio').value,
    stock: campo('stock').value,
    imagen: campo('imagen').value.trim(),
    description: campo('descripcion').value.trim()
  };
  if (conIcono) datos.icon = campo('icon').value || 'package';
  return datos;
}

// Vista previa mientras se escribe la URL de la imagen; si no carga (URL
// rota o vacía), la vista previa simplemente se oculta.
function previewProductoImagen(previewId, url) {
  const img = document.getElementById(previewId);
  if (!img) return;
  if (!url) {
    img.style.display = 'none';
    img.removeAttribute('src');
    return;
  }
  img.src = url;
}

// Si la imagen de una tarjeta falla, usa el ícono de respaldo (data-* evita
// mezclar comillas del SVG).
function handleProductImgError(imgEl) {
  const container = imgEl.parentElement;
  const iconName = container.getAttribute('data-fallback-icon') || 'package';
  container.innerHTML = Icons.svg(iconName, { size: 40 });
}

// Contenido de la caja de imagen de una tarjeta: la foto si hay URL, si no el ícono.
function productImageHtml(p) {
  if (p.imagen) {
    return `<img src="${escapeHtml(p.imagen)}" alt="${escapeHtml(p.nombre)}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;" onerror="handleProductImgError(this)">`;
  }
  return Icons.svg(p.icon || 'package', { size: 40 });
}
