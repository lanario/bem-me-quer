# RLS e permissões – Bem Me Quer

## Estado atual (Fase 8)

Todas as tabelas do schema possuem **Row Level Security (RLS)** habilitado com uma única política por tabela:

- **Nome da política:** `Authenticated read write <tabela>`
- **Regra:** `FOR ALL TO authenticated USING (true) WITH CHECK (true)`

Ou seja: qualquer usuário **autenticado** no Supabase Auth pode **ler, inserir, atualizar e excluir** em todas as linhas de todas as tabelas. Não há distinção de perfil (ex.: admin x operador).

### Tabelas cobertas

- `clients`, `categories`, `brands`, `products`, `stock`, `stock_movements`
- `sells`, `sell_items`, `purchases`, `purchase_items`
- `stock_transfers`, `returns`, `return_items`, `price_history`

## Quando restringir por perfil

Se no futuro for necessário diferenciar permissões, por exemplo:

- **Ajuste de estoque** – apenas admin
- **Cancelar compra já recebida** – apenas admin
- **Aprovar/rejeitar devolução** – apenas admin
- **Relatórios** – leitura para todos, exportação apenas admin

duas abordagens possíveis:

1. **Tabela `profiles`**  
   - Criar tabela `profiles (user_id UUID PK, role text)` vinculada a `auth.users`.  
   - Nas políticas RLS, usar subconsulta para checar `role` (ex.: `role = 'admin'`) em `SELECT`/`INSERT`/`UPDATE`/`DELETE`.

2. **Custom claims / JWT**  
   - Usar `app_metadata` ou custom claim no JWT do Supabase para `role`.  
   - Nas políticas, usar `auth.jwt() ->> 'role' = 'admin'` (ou função equivalente).

As Server Actions continuam sendo o ponto único de mutação; a checagem de perfil pode ser feita tanto no RLS quanto nas actions (ex.: `if (profile.role !== 'admin') return { error: 'Sem permissão' }`).

## Execução das políticas

As políticas atuais estão definidas em:

- `supabase/migrations/00001_initial_schema.sql`  
  (bloco final: `DROP POLICY IF EXISTS` e `CREATE POLICY` por tabela.)

Qualquer alteração futura de RLS deve ser feita em **novas migrações** (ex.: `00002_rls_profiles.sql`), preservando o histórico e a reprodutibilidade do schema.
