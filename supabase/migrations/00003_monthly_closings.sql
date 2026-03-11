-- Tabela para armazenar o fechamento mensal.
-- Ao finalizar um mês, o saldo resultante (receitas - despesas) é gravado
-- e passa a ser o Saldo Atual do mês seguinte.

CREATE TABLE IF NOT EXISTS monthly_closings (
  id BIGSERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  saldo_resultante NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(year, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_closings_year_month ON monthly_closings(year, month);
