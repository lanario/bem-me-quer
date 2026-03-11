# Bem Me Quer - App Next.js

Aplicação Next.js 14 (App Router) + TypeScript + Supabase do sistema de gerenciamento de estoque Bem Me Quer.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Supabase** (Auth, PostgreSQL)
- **TailwindCSS**
- **Recharts** (gráficos)
- **React Icons**

## Pré-requisitos

- Node.js 18+
- Conta [Supabase](https://supabase.com)

## Configuração

1. **Variáveis de ambiente**

   Copie o exemplo e preencha com os dados do seu projeto Supabase:

   ```bash
   cp .env.example .env.local
   ```

   Em `.env.local`:

   - `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto (Settings → API)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave anon/public

2. **Schema do banco (Supabase)**

   No [SQL Editor](https://supabase.com/dashboard/project/_/sql) do Supabase, execute o conteúdo de:

   ```
   supabase/migrations/00001_initial_schema.sql
   ```

   Isso cria tabelas, enums, índices, triggers e políticas RLS.

## Desenvolvimento

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Deploy (Vercel)

1. Conecte o repositório ao [Vercel](https://vercel.com).
2. Configure as variáveis de ambiente em **Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` – URL do projeto Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – chave anon/public
3. Em produção, use um projeto Supabase com o schema aplicado (`supabase/migrations/00001_initial_schema.sql`).
4. Para políticas RLS e evolução de permissões (ex.: perfis admin), veja [.docs/rls-permissoes.md](.docs/rls-permissoes.md).

## Estrutura

- `app/` – rotas e layouts (App Router)
- `components/` – componentes React
- `lib/` – utilitários e cliente Supabase (server, client, middleware)
- `types/` – tipos TypeScript (Database)
- `actions/` – Server Actions
- `supabase/migrations/` – SQL do schema

## Fase 0 (concluída)

- Projeto Next.js 14 com TypeScript e Tailwind
- Recharts e React Icons instalados
- Schema PostgreSQL e RLS em `supabase/migrations/00001_initial_schema.sql`
- Cliente Supabase (server, client, middleware)
- Tipos em `types/database.ts`

Próxima etapa: **Fase 1** – Autenticação e layout base.

## Fase 8 (ajustes finais)

- RLS documentado em `.docs/rls-permissoes.md`
- Paginação (20 itens) em clientes, produtos, vendas, compras, estoque, movimentações, transferências e devoluções
- Botão de submit com estado de loading (`SubmitButton`) nos formulários principais
- Instruções de deploy na Vercel e referência a RLS no README
