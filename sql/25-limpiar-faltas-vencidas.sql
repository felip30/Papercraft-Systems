-- 25. Limpia las faltas apenas se cumple el veto de 24 horas. Se llama
-- cada vez que la cuenta carga su sesión (login o recarga) — la función
-- valida la fecha en el servidor (NOW()), así nadie puede adelantar el
-- reloj de su navegador para saltarse el veto antes de tiempo.
-- Ejecutar después de 22-strikes-sistema.sql.

CREATE OR REPLACE FUNCTION public.limpiar_faltas_vencidas()
RETURNS TABLE(strikes INTEGER, banned_until TIMESTAMPTZ) AS $$
DECLARE
  v_strikes INTEGER;
  v_banned TIMESTAMPTZ;
BEGIN
  SELECT u.strikes, u.banned_until INTO v_strikes, v_banned
  FROM public.usuarios u WHERE u.id = auth.uid();

  IF v_banned IS NOT NULL AND v_banned <= NOW() AND v_strikes > 0 THEN
    UPDATE public.usuarios u
    SET strikes = 0, banned_until = NULL
    WHERE u.id = auth.uid();
    v_strikes := 0;
    v_banned := NULL;
  END IF;

  RETURN QUERY SELECT v_strikes, v_banned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.limpiar_faltas_vencidas() TO authenticated;
