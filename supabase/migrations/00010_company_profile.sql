-- Perfil da empresa (Bem me Quer) - dados editáveis para PDF e documentos
CREATE TABLE IF NOT EXISTS company_profile (
  id INT PRIMARY KEY DEFAULT 1,
  empresa VARCHAR(200) NOT NULL DEFAULT 'Bem me Quer',
  cnpj VARCHAR(20) NOT NULL DEFAULT '',
  email VARCHAR(254) NOT NULL DEFAULT '',
  celular VARCHAR(20) NOT NULL DEFAULT '',
  endereco VARCHAR(500) NOT NULL DEFAULT '',
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);image.png

-- Inserir linha padrão com os dados da empresa
INSERT INTO company_profile (id, empresa, cnpj, email, celular, endereco)
VALUES (1, 'Bem me Quer', 'ABPl@7628', 'bemequer.store2025@gmail.com', '(21)966418522', 'Rua Dona Teresa 156 - Vila Marines')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE company_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read write company_profile" ON company_profile;
CREATE POLICY "Authenticated read write company_profile" ON company_profile
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE TRIGGER company_profile_updated_at
  BEFORE UPDATE ON company_profile
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
