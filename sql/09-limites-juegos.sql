-- 09. Límite de jugadas diario, aplicado por trigger (no por localStorage,
-- que se podía saltar borrando datos). Ejecutar después de 01-usuarios.sql.

CREATE TABLE IF NOT EXISTS game_plays (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  game TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_plays_usuario_game_fecha
  ON game_plays(usuario_id, game, created_at);

ALTER TABLE game_plays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver mis propias jugadas"
  ON game_plays FOR SELECT
  USING (usuario_id = auth.uid());

CREATE POLICY "Registrar mi propia jugada"
  ON game_plays FOR INSERT
  WITH CHECK (usuario_id = auth.uid());

-- ====================================================================
-- Trigger que hace cumplir el límite diario por juego. Los números
-- deben coincidir con MAX_GIROS_POR_DIA, MAX_MEMORIA_POR_DIA,
-- MAX_TRIVIA_POR_DIA y MAX_DADO_POR_DIA de js/games-controller.js.
-- ====================================================================

CREATE OR REPLACE FUNCTION public.check_game_play_limit()
RETURNS TRIGGER AS $$
DECLARE
  max_diario INTEGER;
  jugadas_hoy INTEGER;
BEGIN
  max_diario := CASE NEW.game
    WHEN 'ruleta'  THEN 3
    WHEN 'memoria' THEN 5
    WHEN 'trivia'  THEN 3
    WHEN 'dado'    THEN 5
    ELSE 999
  END;

  SELECT COUNT(*) INTO jugadas_hoy
  FROM game_plays
  WHERE usuario_id = NEW.usuario_id
    AND game = NEW.game
    AND created_at >= date_trunc('day', NOW());

  IF jugadas_hoy >= max_diario THEN
    RAISE EXCEPTION 'Límite diario alcanzado para %', NEW.game;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_game_play_limit ON game_plays;
CREATE TRIGGER enforce_game_play_limit
  BEFORE INSERT ON game_plays
  FOR EACH ROW EXECUTE FUNCTION public.check_game_play_limit();
