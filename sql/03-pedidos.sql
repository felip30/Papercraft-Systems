-- ====================================================================
-- 03. TABLA DE PEDIDOS
-- Ejecutar DESPUÉS de 01-usuarios.sql y 02-productos.sql.
-- ====================================================================

CREATE TABLE IF NOT EXISTS pedidos (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  usuario_nombre TEXT NOT NULL,
  items JSONB NOT NULL,      -- [{ productId, name, price, quantity }, ...]
  subtotal NUMERIC NOT NULL DEFAULT 0,
  iva NUMERIC NOT NULL DEFAULT 0,       -- 19% (IVA Colombia)
  envio NUMERIC NOT NULL DEFAULT 15000, -- flat COP
  descuento NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (status IN ('pendiente', 'enviado', 'completado', 'cancelado')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);

ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Un cliente solo ve sus propios pedidos.
CREATE POLICY "Usuarios ven sus propios pedidos"
  ON pedidos FOR SELECT
  USING (auth.uid() = usuario_id);

-- Un cliente solo puede crear pedidos a su propio nombre.
CREATE POLICY "Usuarios crean sus propios pedidos"
  ON pedidos FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- Los administradores ven y gestionan todos los pedidos (Panel Admin).
CREATE POLICY "Admins gestionan todos los pedidos"
  ON pedidos FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
