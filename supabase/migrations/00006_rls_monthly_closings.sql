-- Habilita RLS na tabela monthly_closings (exposta via PostgREST).
-- Política: usuários autenticados podem ler e escrever.

ALTER TABLE monthly_closings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read write monthly_closings" ON monthly_closings;
CREATE POLICY "Authenticated read write monthly_closings"
  ON monthly_closings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
