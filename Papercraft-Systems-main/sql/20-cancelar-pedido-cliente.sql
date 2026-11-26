-- 20. Cliente puede cancelar SU pedido, solo si está "pendiente" y solo
-- hacia "cancelado" (no puede marcarlo completado). Ejecutar después de 03.
-- ====================================================================

DROP POLICY IF EXISTS "Usuarios cancelan su propio pedido pendiente" ON pedidos;
CREATE POLICY "Usuarios cancelan su propio pedido pendiente"
  ON pedidos FOR UPDATE
  USING (usuario_id = auth.uid() AND status = 'pendiente')
  WITH CHECK (usuario_id = auth.uid() AND status = 'cancelado');
