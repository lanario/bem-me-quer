-- Templates de estilos para PDFs (Nota Fiscal, etc.)
CREATE TABLE IF NOT EXISTS pdf_templates (
  id BIGSERIAL PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  primary_color VARCHAR(20) NOT NULL DEFAULT '#1e4078',
  table_header_color VARCHAR(20) NOT NULL DEFAULT '#1e4078',
  table_header_text_color VARCHAR(20) NOT NULL DEFAULT '#ffffff',
  row_alt_color VARCHAR(20) NOT NULL DEFAULT '#f5f5f5',
  line_color VARCHAR(20) NOT NULL DEFAULT '#d2d2d2',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO pdf_templates (template_key, primary_color, table_header_color, table_header_text_color, row_alt_color, line_color)
VALUES ('nota_fiscal', '#1e4078', '#1e4078', '#ffffff', '#f5f5f5', '#d2d2d2')
ON CONFLICT (template_key) DO NOTHING;

ALTER TABLE pdf_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read write pdf_templates" ON pdf_templates;
CREATE POLICY "Authenticated read write pdf_templates"
  ON pdf_templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE TRIGGER pdf_templates_updated_at
  BEFORE UPDATE ON pdf_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

