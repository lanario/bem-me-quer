-- Tabela de localizações de estoque.
-- Usada para cadastrar locais (ex: Prateleira A1, Loja) usados em transferências e no estoque.

CREATE TABLE IF NOT EXISTS locations (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read write locations" ON locations;
CREATE POLICY "Authenticated read write locations" ON locations FOR ALL TO authenticated USING (true) WITH CHECK (true);
