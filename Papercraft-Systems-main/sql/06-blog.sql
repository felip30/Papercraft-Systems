-- ====================================================================
-- TABLA DE BLOG POSTS
-- ====================================================================

CREATE TABLE IF NOT EXISTS blog_posts (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  contenido TEXT NOT NULL,
  extracto TEXT,
  autor_id UUID NOT NULL REFERENCES usuarios(id),
  categoria TEXT,
  etiquetas TEXT[],
  imagen_portada TEXT,
  vistas INTEGER DEFAULT 0,
  comentarios_enabled BOOLEAN DEFAULT true,
  publicado BOOLEAN DEFAULT false,
  destacado BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_blog_publicado ON blog_posts(publicado);
CREATE INDEX idx_blog_categoria ON blog_posts(categoria);
CREATE INDEX idx_blog_slug ON blog_posts(slug);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver posts publicados" ON blog_posts
  FOR SELECT USING (publicado = true);

CREATE POLICY "Admin ver todos posts" ON blog_posts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol = 'admin'
    )
  );

-- ====================================================================
-- TABLA DE COMENTARIOS EN BLOG
-- ====================================================================

CREATE TABLE IF NOT EXISTS blog_comentarios (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  aprobado BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_blog_comentarios_post ON blog_comentarios(post_id);

ALTER TABLE blog_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver comentarios aprobados" ON blog_comentarios
  FOR SELECT USING (aprobado = true);
