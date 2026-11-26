-- 23. Descuentos vencen a los 30 días si no se usan (queda en el
-- historial como "vencido"). Ejecutar después de 16-descuentos.sql.

ALTER TABLE descuentos ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days');

-- para los ya existentes sin fecha, 30 días desde que se ganaron (no desde hoy)
UPDATE descuentos SET expires_at = created_at + INTERVAL '30 days' WHERE expires_at IS NULL;

-- antes el admin tampoco podía ver los descuentos de otros, esto lo corrige
DROP POLICY IF EXISTS "Ver propios descuentos" ON descuentos;
CREATE POLICY "Ver propios descuentos o todos si es admin"
  ON descuentos FOR SELECT
  USING (usuario_id = auth.uid() OR public.is_admin());
