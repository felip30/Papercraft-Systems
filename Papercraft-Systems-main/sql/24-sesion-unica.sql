-- 24. Una sola sesión activa por cuenta: iniciar sesión en otro lado
-- invalida la anterior. Ejecutar después de 01-usuarios.sql.

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS current_session_id TEXT;
