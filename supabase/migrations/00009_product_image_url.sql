-- URL da imagem do produto (Supabase Storage bucket "produtos")
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN products.image_url IS 'URL pública da imagem no bucket Storage produtos';
