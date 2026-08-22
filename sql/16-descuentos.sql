-- 16. Descuentos ganados en juegos, en Supabase (antes se perdían al
-- cambiar de dispositivo). Ejecutar después de 01-usuarios.sql.
-- ====================================================================

CREATE TABLE IF NOT EXISTS descuentos (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  percentage INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'ruleta',
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_descuentos_usuario ON descuentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_descuentos_code ON descuentos(code);

ALTER TABLE descuentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver propios descuentos" ON descuentos;
CREATE POLICY "Ver propios descuentos" ON descuentos
  FOR SELECT USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "Crear propio descuento" ON descuentos;
CREATE POLICY "Crear propio descuento" ON descuentos
  FOR INSERT WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "Marcar propio descuento como usado" ON descuentos;
CREATE POLICY "Marcar propio descuento como usado" ON descuentos
  FOR UPDATE USING (usuario_id = auth.uid());
