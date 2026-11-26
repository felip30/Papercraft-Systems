# PaperCraft Systems ⚡

E-commerce con panel de administrador, juegos interactivos con créditos y
descuentos, y un sistema de cuentas real — todo conectado a una base de
datos en la nube (Supabase), no a datos falsos guardados en el navegador.

## Tecnologías utilizadas
- HTML5, CSS3 (tema neón/cyberpunk), JavaScript (Vanilla, sin frameworks ni build)
- Supabase: base de datos (Postgres), autenticación, Storage (fotos de perfil)
- jsPDF: generación de facturas y comprobantes en PDF

## Cómo levantar el proyecto de cero

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Copia tu **Project URL** y tu **Anon/Publishable Key** en `js/supabase-config.js`.
3. Corre los scripts de `sql/` en orden (del 01 al 30) en el SQL Editor de Supabase — ver `sql/README.md` para el detalle de qué hace cada uno.
4. Abre `index.html` con un servidor local (por ejemplo, la extensión "Live Server" de VS Code, o `python3 -m http.server`). Abrirlo directo con doble clic (sin servidor) no funciona bien porque el navegador bloquea algunas peticiones.
5. Regístrate desde el sitio, y promueve tu cuenta a `admin` a mano desde **Table Editor → usuarios** en Supabase (columna `role`).

## Estructura del proyecto

```
index.html, shop.html, cart.html, games.html, admin.html   → páginas principales
js/auth.js         → sesión, login/registro, faltas, sesión única por cuenta
js/dataManager.js  → productos, pedidos, juegos, descuentos, Vault Gamer
js/ui.js           → modales, perfil, historial de compras, notificaciones
js/games-controller.js → lógica de los 4 juegos (Ruleta, Memoria, Trivia, Dado)
js/invoice.js      → generación de facturas y comprobantes en PDF
js/product-form.js → formulario de producto (agregar/editar) compartido por tienda y panel admin
js/navbar.js       → navbar compartido de tienda, carrito y juegos
js/page-loader.js  → pantalla de carga compartida (zorro + anillo)
js/utils/card.js   → formateo y validación de tarjeta (carrito y vista previa del inicio)
css/core.css       → fuente + variables + app.css (lo enlazan todas las páginas)
css/main.css       → core.css + base.css + page-loader.css (páginas principales)
sql/               → scripts de base de datos, numerados en el orden en que se corren
assets/            → favicon, código QR, logo
```

## Funciones principales

- Catálogo con imágenes opcionales, filtros y control de stock automático.
- Carrito con pago simulado por tarjeta o pago en tienda, factura en PDF con código QR y de recogida.
- 4 juegos con créditos y descuentos reales, límite diario controlado por la base de datos.
- Historial de compras del cliente: cancelar (con temporizador de 7 minutos gratis), descargar factura.
- Panel de administrador: inventario, usuarios, pedidos, informe de juegos y premios, Vault Gamer.
- Seguridad: RLS en todas las tablas, protección contra XSS y fuerza bruta, una sola sesión activa por cuenta.
