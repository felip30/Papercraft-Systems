-- ====================================================================
-- 02. TABLA DE PRODUCTOS
-- Ejecutar DESPUÉS de 01-usuarios.sql.
-- ====================================================================

CREATE TABLE IF NOT EXISTS productos (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  precio NUMERIC NOT NULL, -- pesos colombianos (COP), sin decimales
  stock INTEGER NOT NULL DEFAULT 0,
  original_stock INTEGER NOT NULL DEFAULT 0,
  icon TEXT DEFAULT 'package', -- nombre de ícono SVG (js/utils/icons.js)
  description TEXT,
  status TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_status ON productos(status);

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- El catálogo es público: cualquiera puede verlo, con o sin sesión.
CREATE POLICY "Productos visibles para todos"
  ON productos FOR SELECT
  USING (true);

-- Solo administradores pueden crear/editar/eliminar productos.
CREATE POLICY "Solo admins gestionan productos"
  ON productos FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Semilla: mismos 8 productos que ya tienes en js/dataManager.js, en COP.
INSERT INTO productos (nombre, categoria, precio, stock, original_stock, icon, description, status) VALUES
  ('Cuaderno Premium A4',        'papelería',   52000,  45, 45, 'notebook', 'Cuaderno premium con 200 hojas rayadas',            'activo'),
  ('Agenda 2024',                'papelería',   76000,  20, 20, 'book',     'Agenda ejecutiva con diseño moderno',               'activo'),
  ('Set de Colores 48pc',        'papelería',  104000,  30, 30, 'palette',  'Set profesional de 48 colores',                     'activo'),
  ('Resma Papel Blanco',         'papelería',   36000, 100,100, 'document', 'Resma de 500 hojas A4 80gsm',                       'activo'),
  ('Teclado Mecánico RGB',       'tecnología', 360000,   3, 15, 'gamepad',  'Teclado mecánico RGB con switches Outemu',          'activo'),
  ('Mouse Inalámbrico Pro',      'tecnología', 144000,  25, 25, 'target',   'Mouse ergonómico inalámbrico 2.4GHz',               'activo'),
  ('Headphones Bluetooth',       'tecnología', 240000,  18, 18, 'bell',     'Headphones con cancelación de ruido',               'activo'),
  ('Soporte Teléfono Ajustable', 'tecnología',  64000,  50, 50, 'package',  'Soporte aluminio ajustable para celular/tablet',    'activo')
ON CONFLICT DO NOTHING;
