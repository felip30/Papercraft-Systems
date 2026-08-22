-- ====================================================================
-- TABLA DE RECOMENDACIONES
-- ====================================================================

CREATE TABLE IF NOT EXISTS recomendaciones (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  producto_id BIGINT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'historial', 'similar', 'tendencia', 'comprados_juntos'
  score FLOAT NOT NULL,
  razon TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recomendaciones_usuario ON recomendaciones(usuario_id);
CREATE INDEX idx_recomendaciones_producto ON recomendaciones(producto_id);
CREATE INDEX idx_recomendaciones_tipo ON recomendaciones(tipo);

-- ====================================================================
-- TABLA DE VISTAS DE PRODUCTO
-- ====================================================================

CREATE TABLE IF NOT EXISTS product_views (
  id BIGSERIAL PRIMARY KEY,
  producto_id BIGINT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_views_producto ON product_views(producto_id);
CREATE INDEX idx_product_views_usuario ON product_views(usuario_id);

-- ====================================================================
-- TABLA DE FAVORITOS PRODUCTO (Alternativa a Wishlist)
-- ====================================================================

CREATE TABLE IF NOT EXISTS product_favorites (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  producto_id BIGINT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, producto_id)
);

CREATE INDEX idx_favorites_usuario ON product_favorites(usuario_id);

-- ====================================================================
-- TABLA DE BÚSQUEDAS FRECUENTES
-- ====================================================================

CREATE TABLE IF NOT EXISTS popular_searches (
  id BIGSERIAL PRIMARY KEY,
  termino TEXT NOT NULL,
  veces_buscado INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(termino)
);

CREATE INDEX idx_popular_searches_termino ON popular_searches(termino);
