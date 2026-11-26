-- ====================================================================
-- 30. CATÁLOGO EN TIEMPO REAL
-- Activa Supabase Realtime para la tabla "productos", para que cualquier
-- producto que el admin agregue, edite, desactive o borre aparezca al
-- instante en todas las páginas abiertas (tienda, inicio, panel admin),
-- sin recargar. Ejecutar después de 02-productos.sql.
-- Es seguro volver a correrlo.
-- ====================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'productos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.productos;
  END IF;
END $$;

-- Manda la fila completa en los UPDATE/DELETE (útil para depurar desde
-- el panel de Realtime de Supabase).
ALTER TABLE public.productos REPLICA IDENTITY FULL;

-- No hace falta tocar RLS: la política "Productos visibles para todos"
-- (02-productos.sql) ya permite que cualquiera reciba los cambios.
