# Plan de Pruebas - PaperCraft Systems ⚡

Este documento define la estrategia, matriz de casos de prueba y guía de ejecución automatizada y manual para el sistema **PaperCraft Systems**.

---

## 1. Alcance y Objetivos de Pruebas

El objetivo de este plan de pruebas es garantizar la estabilidad, seguridad, integridad visual y consistencia funcional del sistema E-commerce con temática Cyberpunk/Neón **PaperCraft Systems**, asegurando que todas sus características funcionen sin errores en producción.

### Cobertura del Sistema:
- **Autenticación y Seguridad:** Registro, inicio de sesión, políticas RLS en Supabase, bloqueo por intentos fallidos y sesión única activa por cuenta.
- **Catálogo y Carrito de Compras:** Filtrado dinámico, cálculo en Pesos Colombianos (`formatCOP`), gestión de stock e historial de compras.
- **Juegos Interactivos & Vault Gamer:** Ruleta, Memoria, Trivia y Dado; límites diarios de créditos, adjudicación y caducidad de códigos de descuento.
- **Checkout y Facturación PDF:** Método de pago, comprobantes con código QR y generación de facturas PDF con `jsPDF`, temporizador de cancelación de 7 minutos.
- **Panel de Administración:** Control de inventario, cambio de roles de usuarios, reportes y métricas de juegos.
- **UX / Capturas de Pantalla E2E:** Modales neón, vista móvil (375px) y capturas automáticas de pantalla guardadas en disco.
- **Pruebas de Carga (k6):** Evaluación de rendimiento bajo concurrencia masiva (mínimo 100 Usuarios Virtuales) y generación de reporte HTML gráfico de errores.

---

## 2. Tecnologías de Pruebas (Test Stack)

Para asegurar la calidad del código Vanilla JavaScript, la compatibilidad con navegadores y la resistencia bajo alta carga, el proyecto utiliza un stack moderno de pruebas automatizadas:

| Tecnología | Tipo de Prueba | Propósito |
| :--- | :--- | :--- |
| **Vitest** | Unitaria y de Integración | Ejecución ultrarrápida de pruebas sobre la lógica del cliente JS. |
| **JSDOM** | Entorno de Emulación DOM | Emulación del entorno del navegador en Node.js para interactuar con `window` y `document`. |
| **Playwright** | Pruebas End-to-End (E2E) | Validación visual y funcional en navegadores reales con **capturas automáticas de pantalla**. |
| **k6** | Pruebas de Carga / Rendimiento | Simulación de **mínimo 100 usuarios virtuales (VUs)** simultáneos y **generación de reporte HTML gráfico**. |

---

## 3. Matriz de Casos de Prueba por Módulo

### Módulo 1: Autenticación y Seguridad (`js/auth.js` / Supabase)

#### CP-AUTH-01: Registro e Inicio de Sesión
- **Objetivo:** Verificar que un nuevo usuario puede registrarse e iniciar sesión exitosamente.
- **Pasos:**
  1. Abrir modal de autenticación en `index.html`.
  2. Registrar usuario con correo válido y clave de mínimo 6 caracteres.
  3. Iniciar sesión con las credenciales registradas.
- **Resultado Esperado:** La sesión se almacena en `localStorage`/Supabase Auth y se actualiza la interfaz mostrando el perfil del usuario.

#### CP-AUTH-02: Control de Sesión Única
- **Objetivo:** Validar que una cuenta no mantenga dos sesiones activas simultáneamente.
- **Pasos:**
  1. Iniciar sesión con la cuenta en Navegador A.
  2. Iniciar sesión con la misma cuenta en Navegador B.
- **Resultado Esperado:** El token anterior en Navegador A es invalidado según la función SQL `24-sesion-unica.sql`.

---

### Módulo 2: Catálogo y Carrito (`js/dataManager.js`, `js/utils/currency.js`)

#### CP-SHOP-01: Formateo de Moneda Colombiana (`formatCOP`)
- **Objetivo:** Garantizar que todos los valores monetarios se visualicen sin decimales y con punto como separador de miles.
- **Pasos:**
  1. Evaluar `formatCOP(52000)`.
  2. Evaluar `formatCOP(0)`.
  3. Evaluar `formatCOP("1500000")`.
- **Resultado Esperado:** Retornar `$52.000`, `$0` y `$1.500.000` respectivamente.

#### CP-SHOP-02: Cálculo Total del Carrito y Aplicación de Descuentos
- **Objetivo:** Verificar la adición de items al carrito, multiplicación por cantidad y descuento aplicado.
- **Pasos:**
  1. Agregar 2 unidades de un producto de `$30.000`.
  2. Aplicar un cupón de descuento del 10%.
- **Resultado Esperado:** Subtotal `$60.000`, Descuento `$6.000`, Total a pagar `$54.000`.

---

### Módulo 3: Juegos Interactivos (`js/games-controller.js`)

#### CP-GAME-01: Control de Créditos Diarios
- **Objetivo:** Verificar que el usuario no pueda jugar si agotó sus créditos diarios.
- **Pasos:**
  1. Intentar girar la Ruleta cuando el contador de créditos del día es `0`.
- **Resultado Esperado:** El sistema bloquea el lanzamiento y muestra notificación *"Créditos diarios agotados. Vuelve mañana"*.

#### CP-GAME-02: Generación de Cupón en Vault Gamer
- **Objetivo:** Confirmar que al ganar un juego se genera un código de descuento válido en Supabase.
- **Pasos:**
  1. Completar exitosamente el juego de Memoria o Trivia.
- **Resultado Esperado:** Se añade el cupón a la tabla `descuentos` asociado al ID del usuario y se muestra en el modal Vault Gamer.

---

### Módulo 4: Checkout y Facturación PDF (`js/invoice.js`, `pages/checkout.html`)

#### CP-CHECKOUT-01: Generación de Comprobante / Factura PDF
- **Objetivo:** Validar que la biblioteca `jsPDF` construya el comprobante correctamente.
- **Pasos:**
  1. Realizar una compra simulada de prueba.
  2. Hacer clic en "Descargar Factura PDF".
- **Resultado Esperado:** Se genera y descarga un documento PDF con los productos, total en COP, fecha y código QR de recogida.

#### CP-CHECKOUT-02: Cancelación de Pedido (Temporizador de 7 Minutos)
- **Objetivo:** Verificar que el cliente pueda cancelar su pedido dentro de los primeros 7 minutos.
- **Pasos:**
  1. Ir a `order-history.html` inmediatamente tras la compra.
  2. Hacer clic en "Cancelar Pedido".
- **Resultado Esperado:** El estado del pedido pasa a `Cancelado`, el stock se restaura automáticamente y el botón de cancelación se deshabilita tras 7 minutos.

---

### Módulo 5: Panel de Administración (`admin.html`)

#### CP-ADMIN-01: Restricción de Acceso por Rol
- **Objetivo:** Asegurar que los usuarios con rol `cliente` no puedan ingresar a `admin.html`.
- **Pasos:**
  1. Iniciar sesión con un usuario con `role = 'cliente'`.
  2. Intentar ingresar directamente a `http://localhost:3000/admin.html`.
- **Resultado Esperado:** Redirección automática a `index.html` con mensaje de acceso no autorizado.

---

### Módulo 6: Responsividad, Capturas de Pantalla E2E y Pruebas de Carga k6

#### CP-UI-01: Captura de Pantalla Automática en Escritorio y Móvil (Playwright)
- **Objetivo:** Validar la presentación visual y almacenar automáticamente las capturas de pantalla de la aplicación.
- **Pasos:**
  1. Ejecutar las pruebas E2E con Playwright.
- **Resultado Esperado:** Las capturas de pantalla de la landing page y vista móvil se guardan automáticamente en `tests/e2e/screenshots/`.

#### CP-LOAD-01: Prueba de Rendimiento con 100 Usuarios Virtuales (k6)
- **Objetivo:** Evaluar la tasa de respuesta y errores del servidor bajo una carga concurrente de **mínimo 100 usuarios virtuales (VUs)**.
- **Pasos:**
  1. Ejecutar `npm run test:load` (o `k6 run tests/load/k6_load_test.js`).
- **Resultado Esperado:** 
  - La tasa de fallos HTTP debe ser menor al 5%.
  - Se genera un **reporte HTML gráfico dinámico** en `tests/load/reports/load_test_report.html` detallando la tasa de éxito y posibles errores.

---

## 4. Guía de Ejecución de Pruebas Automatizadas

### Requisitos Previos:
- Node.js versión 18 o superior.
- k6 instalado (`winget install k6.k6` en Windows, `brew install k6` en macOS, o descarga directa desde [k6.io](https://k6.io)).
- Instalación de dependencias del proyecto:
  ```bash
  npm install
  ```

### Ejecutar Pruebas Unitarias e Integración (Vitest):
```bash
# Ejecutar todas las pruebas unitarias
npm test

# O ejecutar en modo vigilancia (watch)
npm run test:unit
```

### Ejecutar Pruebas E2E y Capturas de Pantalla (Playwright):
```bash
# Instalar los navegadores de Playwright (solo la primera vez)
npx playwright install

# Ejecutar las pruebas E2E y generar capturas de pantalla
npm run test:e2e
```
*Las capturas de pantalla se guardan en:* `tests/e2e/screenshots/`

### Ejecutar Pruebas de Carga con 100 Usuarios Virtuales (k6):
```bash
# Ejecutar prueba de carga k6
npm run test:load
```
*El reporte gráfico en HTML se genera automáticamente en:* `tests/load/reports/load_test_report.html`

---

## 5. Reporte de Resultados y Mantenimiento

Cada ejecución de pruebas genera artefactos visuales y reportes interactivos:
- **Vitest:** Reporte detallado en consola con tiempos de respuesta por suite.
- **Playwright:** Capturas de pantalla `fullPage` guardadas en `tests/e2e/screenshots/` y reportes HTML en `tests/e2e/reports/`.
- **k6:** Dashboard gráfico en HTML guardado en `tests/load/reports/load_test_report.html` que grafica solicitudes por segundo, latencia p(95), HTTP status codes y tasa de errores.
