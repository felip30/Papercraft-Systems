-- 22. Faltas por cancelación tardía: 7 min gratis, después genera falta.
-- 3 faltas = 24h de veto. El contador solo se toca vía función abajo.
-- Ejecutar después de 01-usuarios.sql y 03-pedidos.sql.

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS strikes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS banned_until TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.registrar_strike_cancelacion(p_order_id BIGINT)
RETURNS TABLE(nuevos_strikes INTEGER, nuevo_veto TIMESTAMPTZ) AS $$
DECLARE
  v_usuario_id UUID;
  v_strikes INTEGER;
  v_veto TIMESTAMPTZ;
BEGIN
  -- Confirma que el pedido es de quien está llamando a la función, para
  -- que nadie pueda generarle una falta a otra cuenta.
  SELECT usuario_id INTO v_usuario_id FROM public.pedidos WHERE id = p_order_id;

  IF v_usuario_id IS NULL OR v_usuario_id != auth.uid() THEN
    RAISE EXCEPTION 'No autorizado para registrar una falta en este pedido';
  END IF;

  UPDATE public.usuarios u
  SET strikes = u.strikes + 1,
      banned_until = CASE
        WHEN u.strikes + 1 >= 3 THEN NOW() + INTERVAL '24 hours'
        ELSE u.banned_until
      END
  WHERE u.id = auth.uid()
  RETURNING u.strikes, u.banned_until INTO v_strikes, v_veto;

  RETURN QUERY SELECT v_strikes, v_veto;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.registrar_strike_cancelacion(BIGINT) TO authenticated;
