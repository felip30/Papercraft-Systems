import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Configuración de la prueba de carga con mínimo 100 Usuarios Virtuales (VUs)
export const options = {
  stages: [
    { duration: '10s', target: 50 },  // Escalado a 50 usuarios
    { duration: '30s', target: 100 }, // Sostenimiento con MÍNIMO 100 Usuarios Virtuales (VUs)
    { duration: '10s', target: 0 },   // Escalado hacia abajo
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],     // Menos del 5% de errores permitidos
    http_req_duration: ['p(95)<2000'],   // El 95% de las respuestas en menos de 2 segundos
  },
};

export default function () {
  const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

  // 1. Cargar Página Principal
  const resHome = http.get(`${BASE_URL}/index.html`);
  check(resHome, {
    'Status 200 en Home': (r) => r.status === 200,
    'Tiempo de respuesta < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(1);

  // 2. Cargar Tienda / Catálogo
  const resShop = http.get(`${BASE_URL}/shop.html`);
  check(resShop, {
    'Status 200 en Tienda': (r) => r.status === 200,
  });

  sleep(1);

  // 3. Cargar Juegos Interactivos
  const resGames = http.get(`${BASE_URL}/games.html`);
  check(resGames, {
    'Status 200 en Juegos': (r) => r.status === 200,
  });

  sleep(1);
}

// Generación del Reporte HTML interactivo con gráficos de errores y rendimiento
export function handleSummary(data) {
  return {
    'tests/load/reports/load_test_report.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
