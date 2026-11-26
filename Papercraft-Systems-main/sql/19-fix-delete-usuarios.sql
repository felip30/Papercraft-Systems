-- 19. Fix: reafirma la política de borrado de usuarios (por si había
-- quedado desactualizada). Ejecutar después de 01-usuarios.sql.

DROP POLICY IF EXISTS "Solo admin elimina perfiles" ON usuarios;
CREATE POLICY "Solo admin elimina perfiles"
  ON usuarios FOR DELETE
  USING (public.is_admin());
