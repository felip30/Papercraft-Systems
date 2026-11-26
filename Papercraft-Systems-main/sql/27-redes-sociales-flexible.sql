-- 27. Redes sociales flexible: reemplaza la tabla de una sola fila fija
-- (creada en 26-redes-sociales.sql) por una LISTA de contactos, donde el
-- admin puede agregar cuantos quiera: más redes sociales, correo,
-- teléfono, o cualquier otro tipo de contacto.
-- Ejecutar después de 26-redes-sociales.sql.
-- ====================================================================

DROP TABLE IF EXISTS redes_sociales;

CREATE TABLE redes_sociales (
  id BIGSERIAL PRIMARY KEY,
  -- tipo: instagram, whatsapp, facebook, tiktok, youtube, twitterX,
  -- email, telefono, u "otro" (con etiqueta personalizada)
  tipo TEXT NOT NULL DEFAULT 'otro',
  etiqueta TEXT,          -- nombre a mostrar cuando tipo = 'otro' (ej. "Discord")
  valor TEXT NOT NULL,    -- URL, correo o número de teléfono
  orden BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_redes_sociales_orden ON redes_sociales(orden);

-- Datos de ejemplo/falsos para que el footer no se vea vacío desde el
-- primer momento; el admin los reemplaza por los reales desde el panel.
INSERT INTO redes_sociales (tipo, valor, orden) VALUES
  ('instagram', 'https://instagram.com/papercraftsystems', 1),
  ('whatsapp', 'https://wa.me/573000000000', 2);

ALTER TABLE redes_sociales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede ver las redes sociales" ON redes_sociales
  FOR SELECT USING (true);

CREATE POLICY "Solo admin agrega redes sociales" ON redes_sociales
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Solo admin actualiza redes sociales" ON redes_sociales
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Solo admin elimina redes sociales" ON redes_sociales
  FOR DELETE USING (public.is_admin());
