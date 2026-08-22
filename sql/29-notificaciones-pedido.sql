-- 29. Preferencia de notificación por correo cuando cambia el estado de
-- un pedido (ej. "enviado"). Se pregunta en el checkout y se guarda en el
-- perfil del usuario. Por defecto activa, ya que el correo ya es
-- obligatorio para tener cuenta.
-- Ejecutar después de 01-usuarios.sql.

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS notificar_pedidos BOOLEAN NOT NULL DEFAULT true;
