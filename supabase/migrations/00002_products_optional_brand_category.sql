-- Marca e categoria opcionais no cadastro de produto
ALTER TABLE products
  ALTER COLUMN brand_id DROP NOT NULL,
  ALTER COLUMN category_id DROP NOT NULL;
