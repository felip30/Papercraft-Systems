-- ====================================================================
-- TABLA DE WISHLIST (LISTA DE FAVORITOS)
-- ====================================================================

CREATE TABLE IF NOT EXISTS wishlist (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  producto_id BIGINT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  agregado_en TIMESTAMP DEFAULT NOW(),
  notificar_descuento BOOLEAN DEFAULT true,
  prioridad INTEGER DEFAULT 0,
  notas TEXT,
  compartido BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, producto_id)
);

-- Índices
CREATE INDEX idx_wishlist_usuario ON wishlist(usuario_id);
CREATE INDEX idx_wishlist_producto ON wishlist(producto_id);
CREATE INDEX idx_wishlist_compartido ON wishlist(compartido);

-- Row Level Security
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Política: Ver solo propias wishlist
CREATE POLICY "Ver propia wishlist" ON wishlist
  FOR SELECT USING (usuario_id = auth.uid() OR compartido = true);

-- Política: Crear en wishlist
CREATE POLICY "Agregar a wishlist" ON wishlist
  FOR INSERT
  WITH CHECK (usuario_id = auth.uid());

-- Política: Actualizar propia wishlist
CREATE POLICY "Actualizar propia wishlist" ON wishlist
  FOR UPDATE
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- Política: Eliminar de wishlist
CREATE POLICY "Eliminar de wishlist" ON wishlist
  FOR DELETE
  USING (usuario_id = auth.uid());
