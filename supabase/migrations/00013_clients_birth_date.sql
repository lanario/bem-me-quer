-- Data de nascimento do cliente (opcional)
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS birth_date DATE;

COMMENT ON COLUMN clients.birth_date IS 'Data de nascimento do cliente (opcional)';
