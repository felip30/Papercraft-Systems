-- 17. URL de imagen opcional en productos (vacío = sigue usando el
-- ícono). Ejecutar después de 02-productos.sql.

ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen TEXT;
