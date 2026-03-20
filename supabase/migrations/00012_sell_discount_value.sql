-- Desconto por venda (aplicado no total)
ALTER TABLE sells
ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10, 2) NOT NULL DEFAULT 0;

