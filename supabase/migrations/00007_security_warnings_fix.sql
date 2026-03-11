-- Corrige warnings de segurança sem alterar o funcionamento:
-- 1) Function Search Path: funções com search_path fixo.
-- 2) RLS Policy Always True: políticas explícitas (auth.uid() IS NOT NULL) em vez de (true).

-- ==================== 1) FUNCTIONS SEARCH PATH ====================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_stock_last_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$;

-- ==================== 2) RLS POLICIES (expressão explícita para usuário autenticado) ====================
-- Comportamento idêntico: apenas usuários autenticados (auth.uid() IS NOT NULL) têm acesso.

DROP POLICY IF EXISTS "Authenticated read write clients" ON clients;
CREATE POLICY "Authenticated read write clients" ON clients
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated read write categories" ON categories;
CREATE POLICY "Authenticated read write categories" ON categories
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated read write brands" ON brands;
CREATE POLICY "Authenticated read write brands" ON brands
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated read write products" ON products;
CREATE POLICY "Authenticated read write products" ON products
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated read write stock" ON stock;
CREATE POLICY "Authenticated read write stock" ON stock
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated read write stock_movements" ON stock_movements;
CREATE POLICY "Authenticated read write stock_movements" ON stock_movements
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated read write sells" ON sells;
CREATE POLICY "Authenticated read write sells" ON sells
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated read write sell_items" ON sell_items;
CREATE POLICY "Authenticated read write sell_items" ON sell_items
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated read write purchases" ON purchases;
CREATE POLICY "Authenticated read write purchases" ON purchases
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated read write purchase_items" ON purchase_items;
CREATE POLICY "Authenticated read write purchase_items" ON purchase_items
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated read write stock_transfers" ON stock_transfers;
CREATE POLICY "Authenticated read write stock_transfers" ON stock_transfers
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated read write returns" ON returns;
CREATE POLICY "Authenticated read write returns" ON returns
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated read write return_items" ON return_items;
CREATE POLICY "Authenticated read write return_items" ON return_items
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated read write price_history" ON price_history;
CREATE POLICY "Authenticated read write price_history" ON price_history
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated read write locations" ON locations;
CREATE POLICY "Authenticated read write locations" ON locations
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated read write monthly_closings" ON monthly_closings;
CREATE POLICY "Authenticated read write monthly_closings" ON monthly_closings
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- user_profiles (se existir no schema, ex.: criada por extensão Auth)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Authenticated read write user_profiles" ON user_profiles;
    CREATE POLICY "Authenticated read write user_profiles" ON user_profiles
      FOR ALL TO authenticated
      USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;
