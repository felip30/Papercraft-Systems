-- ====================================================================
-- TABLA DE RESEÑAS Y RATINGS
-- ====================================================================

CREATE TABLE IF NOT EXISTS resenas (
  id BIGSERIAL PRIMARY KEY,
  producto_id BIGINT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  titulo TEXT NOT NULL,
  comentario TEXT,
  verificado BOOLEAN DEFAULT false,
  util INTEGER DEFAULT 0,
  aprobada BOOLEAN DEFAULT false,
  respuesta TEXT,
  respuesta_fecha TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimizar búsquedas
CREATE INDEX idx_resenas_producto ON resenas(producto_id);
CREATE INDEX idx_resenas_usuario ON resenas(usuario_id);
CREATE INDEX idx_resenas_aprobada ON resenas(aprobada);
CREATE INDEX idx_resenas_rating ON resenas(rating);

-- Habilitcar Row Level Security
ALTER TABLE resenas ENABLE ROW LEVEL SECURITY;

-- Política: Ver reseñas aprobadas
CREATE POLICY "Ver resenas aprobadas" ON resenas
  FOR SELECT USING (aprobada = true);

-- Política: Admin puede ver todas
CREATE POLICY "Admin ver todas las resenas" ON resenas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol = 'admin'
    )
  );

-- Política: Crear reseña (usuarios logueados)
CREATE POLICY "Crear resena" ON resenas
  FOR INSERT
  WITH CHECK (usuario_id = auth.uid());

-- Política: Actualizar propia reseña
CREATE POLICY "Actualizar propia resena" ON resenas
  FOR UPDATE
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- Política: Eliminar propia reseña
CREATE POLICY "Eliminar propia resena" ON resenas
  FOR DELETE
  USING (usuario_id = auth.uid());
