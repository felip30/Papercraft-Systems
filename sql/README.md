# Scripts SQL — PaperCraft Systems

Correr **en este orden**, cada uno en el SQL Editor de Supabase. Todos son
seguros de volver a correr si hace falta (usan `IF NOT EXISTS` /
`DROP ... IF EXISTS` antes de crear), salvo donde se indique lo contrario.

Si estás armando el proyecto de cero en un Supabase nuevo, corre del 01 al
24 en orden. Si ya tienes el proyecto funcionando y solo quieres saber qué
hace cada uno, usa esta lista como referencia.

| # | Script | Qué hace |
|---|--------|----------|
| 01 | `01-usuarios.sql` | Tabla `usuarios` (perfil de cada cuenta), función `is_admin()`, trigger que crea el perfil automáticamente al registrarse. **Base de todo lo demás.** |
| 02 | `02-productos.sql` | Tabla `productos` (catálogo), con los 8 productos de ejemplo cargados. |
| 03 | `03-pedidos.sql` | Tabla `pedidos`. |
| 04 | `04-resenas.sql` | Tabla `resenas` (reseñas de productos — la base de datos está lista, pero el sitio todavía no tiene pantalla para usarla). |
| 05 | `05-wishlist.sql` | Tabla `wishlist` (lista de deseos — misma situación que reseñas). |
| 06 | `06-blog.sql` | Tablas `blog_posts` y `blog_comentarios` (no confundir con Vault Gamer, que es un sistema aparte y sí está en uso). |
| 07 | `07-pagos-stripe.sql` | Tablas `stripe_payments`, `stripe_refunds`, `stripe_coupons` (preparadas para una integración real de Stripe a futuro; el pago actual del sitio es simulado). |
| 08 | `08-recomendaciones.sql` | Tablas `recomendaciones`, `product_views`, `product_favorites`, `popular_searches`. |
| 09 | `09-limites-juegos.sql` | Tabla `game_plays` + trigger que hace cumplir el límite diario de cada juego (Ruleta, Memoria, Trivia, Dado) del lado del servidor. |
| 10 | `10-pregunta-seguridad.sql` | Funciones para la pregunta de seguridad del registro (la respuesta se guarda cifrada, nunca en texto plano). |
| 11 | `11-perfil-completo.sql` | Columnas extra en `usuarios` (nombre completo, teléfono, dirección, foto) + bucket de Storage para las fotos de perfil. |
| 12 | `12-rls-faltante.sql` | Corrección de seguridad: le agrega Row Level Security a 5 tablas que se habían quedado sin protección (`recomendaciones`, `product_views`, `product_favorites`, `popular_searches`, `stripe_coupons`). |
| 13 | `13-limite-login.sql` | Tabla `login_attempts` + límite de intentos de inicio de sesión (protección contra fuerza bruta). |
| 14 | `14-vault-games.sql` | Tabla `vault_games` (el blog de guías de videojuegos), con los 5 juegos de ejemplo ya cargados. |
| 15 | `15-game-scores.sql` | Tabla `game_scores` (historial de partidas jugadas). |
| 16 | `16-descuentos.sql` | Tabla `descuentos` (premios/cupones ganados en juegos). |
| 17 | `17-imagen-producto.sql` | Columna `imagen` en productos (URL opcional de foto real, en vez de solo ícono). |
| 18 | `18-metodo-pago.sql` | Columna `metodo_pago` en pedidos (tarjeta o en tienda). |
| 19 | `19-fix-delete-usuarios.sql` | Corrección: reafirma la política que permite al admin eliminar cuentas (por si había quedado desactualizada). |
| 20 | `20-cancelar-pedido-cliente.sql` | Permite que un cliente cancele **su propio** pedido, solo mientras esté "pendiente". |
| 21 | `21-fix-timezone.sql` | Corrección: todas las columnas de fecha pasan de `TIMESTAMP` a `TIMESTAMPTZ`, para que las horas se muestren correctas según la zona horaria de quien mira la pantalla. |
| 22 | `22-strikes-sistema.sql` | Sistema de faltas: cancelar un pedido pasados los 7 minutos gratuitos genera una falta; a las 3, veto de 24 horas. |
| 23 | `23-vencimiento-descuentos.sql` | Los premios de juegos vencen a los 30 días si no se usan; corrige también un permiso para que el admin vea los premios de todos los usuarios. |
| 24 | `24-sesion-unica.sql` | Una sola sesión activa por cuenta — iniciar sesión en otro dispositivo cierra la sesión anterior. |
| 25 | `25-limpiar-faltas-vencidas.sql` | Limpieza automática de faltas del sistema de strikes que ya vencieron. |
| 26 | `26-redes-sociales.sql` | Tabla `redes_sociales` (fila única con Instagram y WhatsApp) editable desde el Panel Admin → pestaña "Redes", visible en el footer del sitio. |
| 27 | `27-redes-sociales-flexible.sql` | Reemplaza la tabla anterior por una lista flexible: el admin puede agregar cualquier cantidad de redes, correos o teléfonos, no solo Instagram/WhatsApp. |
| 28 | `28-fix-orden-redes-sociales.sql` | Corrección: la columna `orden` de `redes_sociales` pasa de `INTEGER` a `BIGINT` (el panel guarda ahí un timestamp, que no cabía en `INTEGER`). |
| 29 | `29-notificaciones-pedido.sql` | Columna `notificar_pedidos` en `usuarios`: preferencia para recibir un correo cuando cambia el estado de un pedido (requiere también desplegar la Edge Function `supabase/functions/notificar-pedido`). |

## Notas

- **04, 05, 06, 07, 08**: crean tablas que ya tienen su seguridad (RLS) lista, pero el sitio todavía no las usa desde ninguna pantalla. No hacen daño estar ahí — quedan preparadas para el día que se conecten.
- **12, 19, 21, 23**: son *correcciones* sobre scripts anteriores, no funciones nuevas — se numeraron por orden de cuándo se detectó cada problema, no porque dependan de scripts intermedios específicos.
- Si en algún momento un script te da error de "ya existe" en algo que no tiene `IF NOT EXISTS`/`IF EXISTS`, probablemente ya lo corriste antes — no pasa nada, solo sáltatelo.
