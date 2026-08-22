-- ====================================================================
-- TABLA DE PAGOS STRIPE
-- ====================================================================

CREATE TABLE IF NOT EXISTS stripe_payments (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  pedido_id BIGINT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_charge_id TEXT,
  stripe_customer_id TEXT,
  monto NUMERIC NOT NULL,
  moneda TEXT DEFAULT 'usd',
  estado TEXT NOT NULL,
  metodo_pago TEXT,
  recibo_url TEXT,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stripe_usuario ON stripe_payments(usuario_id);
CREATE INDEX idx_stripe_pedido ON stripe_payments(pedido_id);
CREATE INDEX idx_stripe_estado ON stripe_payments(estado);
CREATE INDEX idx_stripe_payment_intent ON stripe_payments(stripe_payment_intent_id);

ALTER TABLE stripe_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver propios pagos" ON stripe_payments
  FOR SELECT USING (usuario_id = auth.uid());

CREATE POLICY "Admin ver todos pagos" ON stripe_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol = 'admin'
    )
  );

-- ====================================================================
-- TABLA DE REEMBOLSOS
-- ====================================================================

CREATE TABLE IF NOT EXISTS stripe_refunds (
  id BIGSERIAL PRIMARY KEY,
  pago_id BIGINT NOT NULL REFERENCES stripe_payments(id) ON DELETE CASCADE,
  stripe_refund_id TEXT UNIQUE NOT NULL,
  monto NUMERIC NOT NULL,
  razon TEXT,
  estado TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refund_pago ON stripe_refunds(pago_id);

ALTER TABLE stripe_refunds ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- TABLA DE CUPONES STRIPE
-- ====================================================================

CREATE TABLE IF NOT EXISTS stripe_coupons (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  stripe_coupon_id TEXT,
  tipo TEXT NOT NULL, -- 'porcentaje' o 'fijo'
  valor NUMERIC NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  fecha_expiracion TIMESTAMP,
  usos_maximos INTEGER,
  usos_actuales INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_coupon_codigo ON stripe_coupons(codigo);
CREATE INDEX idx_coupon_activo ON stripe_coupons(activo);
