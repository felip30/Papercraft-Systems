-- 21. Fix zona horaria: TIMESTAMP -> TIMESTAMPTZ en todas las columnas
-- de fecha (Supabase guarda en UTC, pero sin la etiqueta el navegador
-- lo interpretaba como hora local, corriendo todas las fechas mostradas).
-- Ejecutar en cualquier momento, después de que existan las tablas.

-- usuarios
ALTER TABLE usuarios ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE usuarios ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE usuarios ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE usuarios ALTER COLUMN updated_at SET DEFAULT NOW();

-- productos
ALTER TABLE productos ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE productos ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE productos ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE productos ALTER COLUMN updated_at SET DEFAULT NOW();

-- pedidos (el que reportaste — creación vs. cancelación)
ALTER TABLE pedidos ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE pedidos ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE pedidos ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE pedidos ALTER COLUMN updated_at SET DEFAULT NOW();

-- resenas
ALTER TABLE resenas ALTER COLUMN respuesta_fecha TYPE TIMESTAMPTZ USING respuesta_fecha AT TIME ZONE 'UTC';
ALTER TABLE resenas ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE resenas ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE resenas ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE resenas ALTER COLUMN updated_at SET DEFAULT NOW();

-- wishlist
ALTER TABLE wishlist ALTER COLUMN agregado_en TYPE TIMESTAMPTZ USING agregado_en AT TIME ZONE 'UTC';
ALTER TABLE wishlist ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE wishlist ALTER COLUMN agregado_en SET DEFAULT NOW();
ALTER TABLE wishlist ALTER COLUMN created_at SET DEFAULT NOW();

-- blog_posts / blog_comentarios
ALTER TABLE blog_posts ALTER COLUMN published_at TYPE TIMESTAMPTZ USING published_at AT TIME ZONE 'UTC';
ALTER TABLE blog_posts ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE blog_posts ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE blog_posts ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE blog_posts ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE blog_comentarios ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE blog_comentarios ALTER COLUMN created_at SET DEFAULT NOW();

-- stripe_payments / stripe_refunds / stripe_coupons
ALTER TABLE stripe_payments ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE stripe_payments ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE stripe_payments ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE stripe_payments ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE stripe_refunds ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE stripe_refunds ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE stripe_coupons ALTER COLUMN fecha_expiracion TYPE TIMESTAMPTZ USING fecha_expiracion AT TIME ZONE 'UTC';
ALTER TABLE stripe_coupons ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE stripe_coupons ALTER COLUMN created_at SET DEFAULT NOW();

-- recomendaciones / product_views / product_favorites / popular_searches
ALTER TABLE recomendaciones ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE recomendaciones ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE product_views ALTER COLUMN viewed_at TYPE TIMESTAMPTZ USING viewed_at AT TIME ZONE 'UTC';
ALTER TABLE product_views ALTER COLUMN viewed_at SET DEFAULT NOW();
ALTER TABLE product_favorites ALTER COLUMN added_at TYPE TIMESTAMPTZ USING added_at AT TIME ZONE 'UTC';
ALTER TABLE product_favorites ALTER COLUMN added_at SET DEFAULT NOW();
ALTER TABLE popular_searches ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE popular_searches ALTER COLUMN created_at SET DEFAULT NOW();

-- game_plays (límites de juego)
ALTER TABLE game_plays ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE game_plays ALTER COLUMN created_at SET DEFAULT NOW();

-- login_attempts (límite de intentos de login)
ALTER TABLE login_attempts ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE login_attempts ALTER COLUMN created_at SET DEFAULT NOW();

-- vault_games
ALTER TABLE vault_games ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE vault_games ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE vault_games ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE vault_games ALTER COLUMN updated_at SET DEFAULT NOW();

-- game_scores
ALTER TABLE game_scores ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE game_scores ALTER COLUMN created_at SET DEFAULT NOW();

-- descuentos
ALTER TABLE descuentos ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE descuentos ALTER COLUMN created_at SET DEFAULT NOW();

-- La función del límite de login compara fechas — su variable interna
-- también tiene que pasar a TIMESTAMPTZ para que siga funcionando bien
-- contra la columna ya corregida.
CREATE OR REPLACE FUNCTION public.check_login_allowed(p_identifier TEXT)
RETURNS TABLE(allowed BOOLEAN, seconds_remaining INT) AS $$
DECLARE
  fallos INT;
  ultimo_fallo TIMESTAMPTZ;
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
