-- ====================================================================
-- 18. MÉTODO DE PAGO EN PEDIDOS
--
-- Agrega la columna que distingue si un pedido se pagó (simulado) con
-- tarjeta o se va a pagar en tienda sin tarjeta.
--
-- Ejecutar DESPUÉS de 03-pedidos.sql.
-- ====================================================================

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS metodo_pago TEXT DEFAULT 'tarjeta';
