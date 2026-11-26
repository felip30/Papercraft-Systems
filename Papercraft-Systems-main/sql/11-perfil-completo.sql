-- 11. Perfil completo: datos generales + foto. Ejecutar después de 01.

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Bucket de almacenamiento para las fotos de perfil. Es público para LEER
-- (así se puede mostrar la foto en el sitio sin trámites extra), pero cada
-- quien solo puede subir/reemplazar/borrar la suya propia — se identifica
-- por la primera carpeta del archivo, que siempre es su propio user id
-- (ej: avatars/<uuid-del-usuario>/foto.jpg).
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatares visibles para todos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Subir mi propio avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Reemplazar mi propio avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Eliminar mi propio avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
