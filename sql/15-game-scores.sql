-- 15. Puntajes de juegos en Supabase (antes en localStorage, no se veían
-- entre dispositivos). Ejecutar después de 01-usuarios.sql.

CREATE TABLE IF NOT EXISTS game_scores (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  usuario_nombre TEXT NOT NULL,
  game TEXT NOT NULL,
  score TEXT NOT NULL, -- se guarda como texto: a veces es un número, otras "3/5"
  prize TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_scores_usuario ON game_scores(usuario_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game ON game_scores(game);

ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver propios puntajes o todos si es admin" ON game_scores;
CREATE POLICY "Ver propios puntajes o todos si es admin" ON game_scores
  FOR SELECT USING (usuario_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Registrar mi propio puntaje" ON game_scores;
CREATE POLICY "Registrar mi propio puntaje" ON game_scores
  FOR INSERT WITH CHECK (usuario_id = auth.uid());
