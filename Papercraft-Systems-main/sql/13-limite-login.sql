-- 13. Límite de intentos de login: 5 fallos en 15 min = 60s de espera.
-- Controlado server-side. Ejecutar después de 01-usuarios.sql.

CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGSERIAL PRIMARY KEY,
  identifier TEXT NOT NULL, -- username o email usado para intentar entrar
  success BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier ON login_attempts(identifier, created_at);

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Nadie lee ni escribe esta tabla directamente: todo pasa por las dos
-- funciones de abajo (SECURITY DEFINER). Solo el admin puede auditarla
-- a mano si hace falta revisar algo.
DROP POLICY IF EXISTS "Admin audita intentos de login" ON login_attempts;
CREATE POLICY "Admin audita intentos de login" ON login_attempts
  FOR SELECT USING (public.is_admin());

-- Registra un intento (éxito o fallo). La llama el cliente después de
-- cada intento de login, sin importar el resultado.
CREATE OR REPLACE FUNCTION public.record_login_attempt(p_identifier TEXT, p_success BOOLEAN)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.login_attempts (identifier, success)
  VALUES (lower(p_identifier), p_success);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.record_login_attempt(TEXT, BOOLEAN) TO anon, authenticated;

-- Revisa si un usuario/email puede intentar iniciar sesión ahora mismo,
-- o si tiene que esperar por haber fallado demasiadas veces seguidas.
CREATE OR REPLACE FUNCTION public.check_login_allowed(p_identifier TEXT)
RETURNS TABLE(allowed BOOLEAN, seconds_remaining INT) AS $$
DECLARE
  fallos INT;
  ultimo_fallo TIMESTAMP;
  espera_seg INT := 60;
BEGIN
  SELECT COUNT(*), MAX(created_at) INTO fallos, ultimo_fallo
  FROM public.login_attempts
  WHERE identifier = lower(p_identifier)
    AND success = false
    AND created_at > NOW() - INTERVAL '15 minutes';

  IF fallos >= 5 AND ultimo_fallo > NOW() - (espera_seg || ' seconds')::interval THEN
    RETURN QUERY SELECT false, GREATEST(0, espera_seg - EXTRACT(EPOCH FROM (NOW() - ultimo_fallo))::INT);
  ELSE
    RETURN QUERY SELECT true, 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_login_allowed(TEXT) TO anon, authenticated;
