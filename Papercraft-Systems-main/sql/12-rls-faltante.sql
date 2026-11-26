-- 12. Fix: 5 tablas sin RLS (recomendaciones, product_views,
-- product_favorites, popular_searches, stripe_coupons) — quedaban
-- expuestas por la API aunque el sitio no las use todavía.
-- Ejecutar después de 01, 02 y 07.

-- ── recomendaciones ──────────────────────────────────────────────
ALTER TABLE recomendaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver propias recomendaciones" ON recomendaciones;
CREATE POLICY "Ver propias recomendaciones" ON recomendaciones
  FOR SELECT USING (usuario_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admin gestiona recomendaciones" ON recomendaciones;
CREATE POLICY "Admin gestiona recomendaciones" ON recomendaciones
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── product_views ────────────────────────────────────────────────
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Registrar vista de producto" ON product_views;
CREATE POLICY "Registrar vista de producto" ON product_views
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Solo admin ve las vistas" ON product_views;
CREATE POLICY "Solo admin ve las vistas" ON product_views
  FOR SELECT USING (public.is_admin());

-- ── product_favorites ────────────────────────────────────────────
ALTER TABLE product_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver propios favoritos" ON product_favorites;
CREATE POLICY "Ver propios favoritos" ON product_favorites
  FOR SELECT USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "Agregar propios favoritos" ON product_favorites;
CREATE POLICY "Agregar propios favoritos" ON product_favorites
  FOR INSERT WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "Eliminar propios favoritos" ON product_favorites;
CREATE POLICY "Eliminar propios favoritos" ON product_favorites
  FOR DELETE USING (usuario_id = auth.uid());

-- ── popular_searches ─────────────────────────────────────────────
ALTER TABLE popular_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver búsquedas populares" ON popular_searches;
CREATE POLICY "Ver búsquedas populares" ON popular_searches
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Registrar búsqueda" ON popular_searches;
CREATE POLICY "Registrar búsqueda" ON popular_searches
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Actualizar contador de búsqueda" ON popular_searches;
CREATE POLICY "Actualizar contador de búsqueda" ON popular_searches
  FOR UPDATE USING (true) WITH CHECK (true);

-- ── stripe_coupons ───────────────────────────────────────────────
ALTER TABLE stripe_coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver cupones activos" ON stripe_coupons;
CREATE POLICY "Ver cupones activos" ON stripe_coupons
  FOR SELECT USING (activo = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin gestiona cupones" ON stripe_coupons;
CREATE POLICY "Admin gestiona cupones" ON stripe_coupons
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
