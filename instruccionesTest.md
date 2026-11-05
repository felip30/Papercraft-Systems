# Guía e Instrucciones de Pruebas - PaperCraft Systems ⚡

Este documento resume los comandos y la estructura de la suite de pruebas del proyecto **PaperCraft Systems**, incluyendo pruebas unitarias, de integración, capturas de pantalla E2E con Playwright y pruebas de carga con **k6 (mínimo 100 usuarios virtuales y reporte gráfico HTML)**.

---

## 1. Comandos Generales

| Comando | Descripción |
| :--- | :--- |
| `npm test` *(o `npx vitest run`)* | Ejecuta **todas** las pruebas unitarias y de integración de una sola vez. |
| `npm run test:unit` | Ejecuta Vitest en **modo activo (watch)** para reejecutar al modificar código. |
| `npm run test:e2e` | Ejecuta las pruebas E2E con Playwright y **guarda capturas de pantalla automáticas**. |
| `npm run test:load` | Ejecuta las pruebas de carga con **k6 (100 VUs)** y genera **reporte gráfico en HTML**. |

---

## 2. Capturas de Pantalla E2E con Playwright

Las pruebas E2E de Playwright capturan pantallas completas (`fullPage`) de las páginas probadas y las guardan en la carpeta asignada:

- **Carpeta de Capturas de Pantalla:** `tests/e2e/screenshots/`
- **Comando de Ejecución:**
  ```bash
  npm run test:e2e
  ```
- **Capturas Generadas:**
  - `tests/e2e/screenshots/desktop_homepage.png` (Captura completa en resolución de escritorio)
  - `tests/e2e/screenshots/mobile_viewport.png` (Captura en resolución de smartphone 375px)

---

## 3. Pruebas de Carga con k6 (100 Usuarios Virtuales y Graficación HTML)

El script `tests/load/k6_load_test.js` evalúa la capacidad de respuesta y la resistencia del sistema simulando la concurrencia masiva de **mínimo 100 usuarios virtuales simultáneos (VUs)**.

- **Configuración de Carga:**
  - **Escalado inicial:** 50 Usuarios Virtuales (10 seg).
  - **Carga sostenida:** **100 Usuarios Virtuales (30 seg)**.
  - **Desescalado:** 0 usuarios (10 seg).
- **Métricas y Umbrales:**
  - Tasa de errores HTTP menor al 5%.
  - 95% de peticiones servidas en menos de 2000 ms.
- **Reporte Gráfico en HTML:**
  - El reporte gráfico interactivo se genera automáticamente al finalizar en:
    `tests/load/reports/load_test_report.html`
- **Comando de Ejecución:**
  ```bash
  # Ejecutar prueba de carga
  npm run test:load

  # O directamente con el binario de k6:
  k6 run tests/load/k6_load_test.js
  ```

---

## 4. Ejecución por Archivo de Prueba Individual (Vitest)

Puedes ejecutar cada archivo de prueba individualmente:

```bash
# Pruebas de Formateo de Moneda COP
npx vitest run tests/unit/currency.test.js

# Pruebas de Autenticación (Email, Clave, Faltas y Usuarios Admin/Cliente)
npx vitest run tests/unit/auth.test.js

# Pruebas del Carrito de Compras y Descuentos
npx vitest run tests/unit/dataManager.test.js

# Pruebas de Créditos Diarios y Juegos
npx vitest run tests/unit/games.test.js
```