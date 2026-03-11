-- BEM ME QUER - SCHEMA INICIAL (BIGSERIAL)
-- Idempotente: pode ser executada mais de uma vez sem erro.
-- OBS: Esta versão DROPPA as tabelas antes de recriar (cuidado com dados).

-- ================ LIMPEZA OPCIONAL (CUIDADO) =================
DO $$
BEGIN
  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'return_items';
  IF FOUND THEN DROP TABLE return_items CASCADE; END IF;

  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'returns';
  IF FOUND THEN DROP TABLE returns CASCADE; END IF;

  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stock_transfers';
  IF FOUND THEN DROP TABLE stock_transfers CASCADE; END IF;

  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'purchase_items';
  IF FOUND THEN DROP TABLE purchase_items CASCADE; END IF;

  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'purchases';
  IF FOUND THEN DROP TABLE purchases CASCADE; END IF;

  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sell_items';
  IF FOUND THEN DROP TABLE sell_items CASCADE; END IF;

  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sells';
  IF FOUND THEN DROP TABLE sells CASCADE; END IF;

  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'price_history';
  IF FOUND THEN DROP TABLE price_history CASCADE; END IF;

  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stock_movements';
  IF FOUND THEN DROP TABLE stock_movements CASCADE; END IF;

  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stock';
  IF FOUND THEN DROP TABLE stock CASCADE; END IF;

  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products';
  IF FOUND THEN DROP TABLE products CASCADE; END IF;

  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brands';
  IF FOUND THEN DROP TABLE brands CASCADE; END IF;

  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories';
  IF FOUND THEN DROP TABLE categories CASCADE; END IF;

  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients';
  IF FOUND THEN DROP TABLE clients CASCADE; END IF;
END $$;

-- ==================== ENUMS ====================

DO $$ BEGIN
  CREATE TYPE sell_status AS ENUM ('PENDENTE', 'CONCLUIDA', 'CANCELADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE purchase_status AS ENUM ('PENDENTE', 'RECEBIDA', 'CANCELADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE transfer_status AS ENUM ('PENDENTE', 'CONCLUIDA', 'CANCELADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE return_status AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE movement_type AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE', 'DEVOLUCAO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE movement_reason AS ENUM ('COMPRA', 'VENDA', 'AJUSTE', 'PERDA', 'DEVOLUCAO_CLIENTE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE return_reason AS ENUM ('DEFEITO', 'TROCA', 'DESISTENCIA', 'OUTRO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE product_condition AS ENUM ('NOVO', 'USADO', 'DANIFICADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE product_size AS ENUM ('S', 'M', 'L', 'XL', 'XXL', 'XXXL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==================== TABELAS BASE ====================

CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(11) NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_default NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brands (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  size product_size NOT NULL,
  color VARCHAR(50) NOT NULL,
  sell_price NUMERIC(10, 2),
  brand_id BIGINT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  track_stock BOOLEAN NOT NULL DEFAULT true,
  barcode VARCHAR(50) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_title ON products(title);
CREATE INDEX IF NOT EXISTS idx_products_brand_category ON products(brand_id, category_id);

CREATE TABLE IF NOT EXISTS stock (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_quantity INTEGER NOT NULL DEFAULT 0 CHECK (min_quantity >= 0),
  max_quantity INTEGER,
  location VARCHAR(100),
  cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  batch_number VARCHAR(50),
  expiry_date DATE,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_quantity ON stock(quantity);

CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT NOT NULL REFERENCES stock(id) ON DELETE CASCADE,
  movement_type movement_type NOT NULL,
  quantity INTEGER NOT NULL,
  reason movement_reason NOT NULL,
  reference VARCHAR(100),
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  quantity_before INTEGER
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_stock_created ON stock_movements(stock_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reason ON stock_movements(reason);

-- ==================== VENDAS ====================

CREATE TABLE IF NOT EXISTS sells (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  data TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status sell_status NOT NULL DEFAULT 'PENDENTE'
);

CREATE INDEX IF NOT EXISTS idx_sells_client ON sells(client_id);
CREATE INDEX IF NOT EXISTS idx_sells_data ON sells(data DESC);
CREATE INDEX IF NOT EXISTS idx_sells_status ON sells(status);

CREATE TABLE IF NOT EXISTS sell_items (
  id BIGSERIAL PRIMARY KEY,
  sell_id BIGINT NOT NULL REFERENCES sells(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unitary_price NUMERIC(10, 2),
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sell_items_sell_product ON sell_items(sell_id, product_id);

-- ==================== COMPRAS ====================

CREATE TABLE IF NOT EXISTS purchases (
  id BIGSERIAL PRIMARY KEY,
  supplier VARCHAR(100) NOT NULL,
  invoice_number VARCHAR(50),
  purchase_date DATE NOT NULL,
  total_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status purchase_status NOT NULL DEFAULT 'PENDENTE',
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier);

CREATE TABLE IF NOT EXISTS purchase_items (
  id BIGSERIAL PRIMARY KEY,
  purchase_id BIGINT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_product ON purchase_items(purchase_id, product_id);

-- ==================== TRANSFERÊNCIAS ====================

CREATE TABLE IF NOT EXISTS stock_transfers (
  id BIGSERIAL PRIMARY KEY,
  from_location VARCHAR(100) NOT NULL,
  to_location VARCHAR(100) NOT NULL,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  transfer_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status transfer_status NOT NULL DEFAULT 'PENDENTE',
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_transfers_locations ON stock_transfers(from_location, to_location);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_product ON stock_transfers(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_status ON stock_transfers(status);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_date ON stock_transfers(transfer_date DESC);

-- ==================== DEVOLUÇÕES ====================

CREATE TABLE IF NOT EXISTS returns (
  id BIGSERIAL PRIMARY KEY,
  sell_id BIGINT NOT NULL REFERENCES sells(id) ON DELETE CASCADE,
  return_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason return_reason NOT NULL,
  status return_status NOT NULL DEFAULT 'PENDENTE',
  notes TEXT,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_returns_sell ON returns(sell_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_date ON returns(return_date DESC);

CREATE TABLE IF NOT EXISTS return_items (
  id BIGSERIAL PRIMARY KEY,
  return_id BIGINT NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  sell_item_id BIGINT NOT NULL REFERENCES sell_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  condition product_condition NOT NULL,
  restock BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_return_items_return_sell_item ON return_items(return_id, sell_item_id);

-- ==================== HISTÓRICO DE PREÇOS ====================

CREATE TABLE IF NOT EXISTS price_history (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT NOT NULL REFERENCES stock(id) ON DELETE CASCADE,
  cost_price NUMERIC(10, 2) NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_stock_created ON price_history(stock_id, created_at DESC);

-- ==================== TRIGGERS updated_at ====================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clients_updated_at ON clients;
CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS categories_updated_at ON categories;
CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS brands_updated_at ON brands;
CREATE TRIGGER brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION set_stock_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS stock_last_updated ON stock;
CREATE TRIGGER stock_last_updated
  BEFORE UPDATE ON stock
  FOR EACH ROW EXECUTE FUNCTION set_stock_last_updated();

-- ==================== ROW LEVEL SECURITY (RLS) ====================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sells ENABLE ROW LEVEL SECURITY;
ALTER TABLE sell_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Políticas: drop se existir e criar (evita duplicata)
DROP POLICY IF EXISTS "Authenticated read write clients" ON clients;
CREATE POLICY "Authenticated read write clients" ON clients FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read write categories" ON categories;
CREATE POLICY "Authenticated read write categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read write brands" ON brands;
CREATE POLICY "Authenticated read write brands" ON brands FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read write products" ON products;
CREATE POLICY "Authenticated read write products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read write stock" ON stock;
CREATE POLICY "Authenticated read write stock" ON stock FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read write stock_movements" ON stock_movements;
CREATE POLICY "Authenticated read write stock_movements" ON stock_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read write sells" ON sells;
CREATE POLICY "Authenticated read write sells" ON sells FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read write sell_items" ON sell_items;
CREATE POLICY "Authenticated read write sell_items" ON sell_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read write purchases" ON purchases;
CREATE POLICY "Authenticated read write purchases" ON purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read write purchase_items" ON purchase_items;
CREATE POLICY "Authenticated read write purchase_items" ON purchase_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read write stock_transfers" ON stock_transfers;
CREATE POLICY "Authenticated read write stock_transfers" ON stock_transfers FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read write returns" ON returns;
CREATE POLICY "Authenticated read write returns" ON returns FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read write return_items" ON return_items;
CREATE POLICY "Authenticated read write return_items" ON return_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read write price_history" ON price_history;
CREATE POLICY "Authenticated read write price_history" ON price_history FOR ALL TO authenticated USING (true) WITH CHECK (true);