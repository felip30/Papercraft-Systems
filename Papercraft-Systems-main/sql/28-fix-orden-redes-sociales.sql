-- 28. Corrección: la columna 'orden' de redes_sociales se creó como
-- INTEGER, pero el panel admin guarda ahí un timestamp (Date.now(), en
-- milisegundos), que es un número más grande de lo que INTEGER admite.
-- Se cambia a BIGINT. Ejecutar después de 27-redes-sociales-flexible.sql.

ALTER TABLE redes_sociales ALTER COLUMN orden TYPE BIGINT;
