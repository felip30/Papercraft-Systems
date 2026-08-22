-- 26. Redes sociales configurables desde el Panel Admin. Es una tabla de
-- una sola fila (id = 1) con las URLs que se muestran en el footer del
-- sitio. Cualquiera puede leerla (para que se vea en el footer sin estar
-- logueado), pero solo el admin puede editarla.
-- Ejecutar después de 01-usuarios.sql.
-- ====================================================================

CREATE TABLE IF NOT EXISTS redes_sociales (
  id INTEGER PRIMARY KEY DEFAULT 1,
  instagram_url TEXT,
  whatsapp_url TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT redes_sociales_single_row CHECK (id = 1)
);

-- Fila única de configuración (si no existe todavía). Se deja cargada con
-- datos de ejemplo/falsos para que el footer no se vea vacío desde el
-- primer momento; el admin los reemplaza por los reales desde el panel.
INSERT INTO redes_sociales (id, instagram_url, whatsapp_url)
VALUES (1, 'https://instagram.com/papercraftsystems', 'https://wa.me/573000000000')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE redes_sociales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cualquiera puede ver las redes sociales" ON redes_sociales;
CREATE POLICY "Cualquiera puede ver las redes sociales" ON redes_sociales
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Solo admin edita redes sociales" ON redes_sociales;
CREATE POLICY "Solo admin edita redes sociales" ON redes_sociales
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());
