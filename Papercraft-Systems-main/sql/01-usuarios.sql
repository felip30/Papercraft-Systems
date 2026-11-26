-- ====================================================================
-- 01. TABLA DE USUARIOS (perfil extendido sobre auth.users)
-- Ejecutar PRIMERO. Todo lo demás depende de esta tabla.
-- ====================================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'cliente' CHECK (role IN ('cliente', 'admin')),
  credits INTEGER NOT NULL DEFAULT 0,
  security_question TEXT,
  security_answer TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- ====================================================================
-- Funciones auxiliares (SECURITY DEFINER).
-- Se definen ANTES de las políticas de RLS que las usan.
-- ====================================================================

-- ¿El usuario logueado es admin? Se ejecuta con privilegios elevados,
-- así que NO dispara de nuevo las políticas de "usuarios" — evita el
-- problema clásico de recursión infinita al usarla dentro de una policy
-- de la propia tabla "usuarios".
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Permite iniciar sesión con "username" además de email. SOLO devuelve el
-- email asociado — nunca expone el resto de la fila (ni la respuesta de
-- seguridad) — así que es seguro que la llame cualquiera sin sesión.
CREATE OR REPLACE FUNCTION public.get_email_by_username(lookup_username TEXT)
RETURNS TEXT AS $$
  SELECT email FROM public.usuarios WHERE username = lookup_username LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO anon, authenticated;

-- ====================================================================
-- Row Level Security
-- ====================================================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Cada quien ve su propio perfil; los administradores ven todos (lo usa
-- el Panel Admin, pestaña "Usuarios").
CREATE POLICY "Ver perfil propio o todos si es admin"
  ON usuarios FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- Un usuario solo puede editar su propia fila; un admin puede editar
-- cualquiera (por ejemplo, para cambiar el rol o los créditos de otro).
CREATE POLICY "Editar perfil propio o cualquiera si es admin"
  ON usuarios FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

-- Solo un admin puede eliminar perfiles.
CREATE POLICY "Solo admin elimina perfiles"
  ON usuarios FOR DELETE
  USING (public.is_admin());

-- ====================================================================
-- Trigger: crea automáticamente la fila en "usuarios" cuando alguien
-- se registra con Supabase Auth (auth.users), tomando los datos que
-- el cliente manda en options.data al hacer signUp().
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, username, email, role, credits, security_question, security_answer)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    'cliente',
    0,
    NEW.raw_user_meta_data->>'security_question',
    NEW.raw_user_meta_data->>'security_answer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
