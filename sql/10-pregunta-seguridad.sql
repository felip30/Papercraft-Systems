-- 10. Pregunta de seguridad con respuesta cifrada (hash SHA-256, nunca
-- texto plano). get_security_question devuelve la pregunta;
-- verify_security_answer compara el hash sin exponerlo.
-- Ejecutar después de 01-usuarios.sql.

CREATE OR REPLACE FUNCTION public.get_security_question(lookup TEXT)
RETURNS TEXT AS $$
  SELECT security_question FROM public.usuarios
  WHERE username = lookup OR email = lookup
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_security_question(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.verify_security_answer(lookup TEXT, answer_hash TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE (username = lookup OR email = lookup)
      AND security_answer = answer_hash
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.verify_security_answer(TEXT, TEXT) TO anon, authenticated;
