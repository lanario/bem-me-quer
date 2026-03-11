-- Estoque por localização: um produto pode ter quantidades em vários locais.
-- Total do produto = soma das quantidades (e valor = soma qty*cost) de todos os locais.

-- 1) Adicionar location_id ao stock (nullable inicialmente)
ALTER TABLE stock
  ADD COLUMN IF NOT EXISTS location_id BIGINT REFERENCES locations(id) ON DELETE RESTRICT;

-- 2) Garantir que existe ao menos uma localização (Principal)
INSERT INTO locations (name, description)
  SELECT 'Principal', 'Localização padrão de estoque'
  WHERE NOT EXISTS (SELECT 1 FROM locations LIMIT 1);

-- 3) Atribuir estoque existente à localização Principal
UPDATE stock
SET
  location_id = (SELECT id FROM locations WHERE name = 'Principal' LIMIT 1),
  location = 'Principal'
WHERE location_id IS NULL;

-- 4) Remover UNIQUE(product_id) para permitir vários registros por produto (um por local)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'stock'::regclass AND conname = 'stock_product_id_key'
  ) THEN
    ALTER TABLE stock DROP CONSTRAINT stock_product_id_key;
  END IF;
END $$;

-- 5) Garantir UNIQUE(product_id, location_id)
DROP INDEX IF EXISTS stock_product_location_unique;
CREATE UNIQUE INDEX IF NOT EXISTS stock_product_location_unique ON stock(product_id, location_id);

-- 6) location_id obrigatório
ALTER TABLE stock ALTER COLUMN location_id SET NOT NULL;

-- 7) Índice para consultas por local
CREATE INDEX IF NOT EXISTS idx_stock_location_id ON stock(location_id);
