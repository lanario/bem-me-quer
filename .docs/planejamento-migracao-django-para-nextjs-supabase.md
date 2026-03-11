# Planejamento em Fases: Migração Bem Me Quer  
## De Python/Django para Next.js 14 + TypeScript + Supabase

**Versão:** 1.0  
**Data:** 2025-03-10  
**Escopo:** Sistema de gerenciamento de estoque e vendas do app `bem_me_quer`.

---

## 1. Resumo do Sistema Atual (Django)

### 1.1 Visão geral

O sistema atual é um **monolito Django** com:

- **Projeto:** `core` (settings, urls centrais).
- **App principal em foco:** `bem_me_quer` (estoque + vendas).
- **Outros apps no mesmo projeto:** `manto_sagrado`, `alan_barros` (podem permanecer em Django ou ser migrados em etapas futuras).

### 1.2 Stack atual

| Camada        | Tecnologia                          |
|---------------|-------------------------------------|
| Backend       | Django 5.x                          |
| Banco         | SQLite (dev)                        |
| Auth          | Django Auth (User, Group)           |
| Admin         | Django Admin custom (BemMeQuerAdminSite) + Jazzmin |
| Templates     | Django Templates (HTML)             |
| Relatórios    | Views + templates + export CSV      |

### 1.3 Modelos de dados (bem_me_quer)

| Modelo          | Descrição principal                                      |
|-----------------|----------------------------------------------------------|
| **Client**      | Nome, email, telefone, endereço                          |
| **Category**    | Nome, descrição, preço padrão                            |
| **Brand**       | Nome, descrição                                          |
| **Products**    | Nome, descrição, tamanho, cor, preço venda, marca, categoria, track_stock, barcode |
| **Stock**       | Produto (1:1), quantidade, min/max, localização, cost_price, lote, validade |
| **StockMovement** | Estoque, tipo (ENTRADA/SAIDA/AJUSTE/DEVOLUCAO), quantidade, motivo, referência, usuário |
| **Sell**        | Cliente, data, total, status (PENDENTE/CONCLUIDA/CANCELADA) |
| **SellItem**    | Venda, produto, quantidade, preço unitário, subtotal     |
| **Purchase**    | Fornecedor, NF, data, total, status (PENDENTE/RECEBIDA/CANCELADA) |
| **PurchaseItem** | Compra, produto, quantidade, unit_cost, subtotal      |
| **StockTransfer** | Origem/destino (localização), produto, quantidade, status |
| **Return**      | Venda, data, motivo, status (PENDENTE/APROVADA/REJEITADA) |
| **ReturnItem**  | Devolução, item da venda, quantidade, condição, restock |
| **PriceHistory**| Estoque, cost_price, motivo, usuário, data              |

### 1.4 Funcionalidades atuais

- **Dashboard (admin):** métricas de estoque (total produtos, valor total, estoque baixo, sem estoque, vencidos, próximos do vencimento), vendas recentes, gráficos (vendas diário/semanal/mensal, estoque baixo por categoria, movimentações por tipo), alertas (sem estoque, baixo, vencidos, movimentações suspeitas).
- **CRUD via Admin:** Clientes, Categorias, Marcas, Produtos (com inline de Stock), Estoque, Movimentações, Compras (com itens e ações Receber/Cancelar), Vendas (com itens e Confirmar/Cancelar), Transferências (Confirmar/Cancelar), Devoluções (Aprovar/Rejeitar), Histórico de preços.
- **Ajuste de estoque:** view custom no admin com motivo (INVENTARIO, PERDA, ACHADO, CORRECAO) e observações.
- **Relatórios (views + templates):**
  - Estoque atual (filtros: categoria, marca, status, busca; export CSV).
  - Movimentações (filtros: tipo, motivo, produto, datas; agrupamento por tipo; export CSV).
  - Estoque baixo (sugestão de compra; export CSV).
  - Valor de estoque (por categoria, por marca, evolução; export CSV).
- **Regras de negócio:** validação de estoque em SellItem; baixa/devolução de estoque em vendas (confirmar/cancelar); recebimento e cancelamento de compras; confirmação/cancelamento de transferências; aprovação/rejeição de devoluções com reposição condicional; histórico de preço via signal no `Stock`.

---

## 2. Stack Alvo

| Camada        | Tecnologia        | Uso principal                                      |
|---------------|-------------------|----------------------------------------------------|
| Framework     | Next.js 14        | App Router, Server/Client Components, Server Actions |
| Linguagem     | TypeScript        | Tipagem estática, interfaces para API e DB         |
| Backend/DB    | Supabase          | PostgreSQL, Auth, RLS, Storage (se necessário)     |
| Estilização   | TailwindCSS       | Layout e componentes responsivos                   |
| Gráficos      | Recharts          | Dashboard e relatórios                             |
| Ícones        | React Icons       | UI e navegação                                     |

---

## 3. Fases da Migração

### Fase 0: Preparação e ambiente (1–2 semanas)

**Objetivo:** Ambiente Next.js + Supabase pronto e schema do banco definido.

**Tarefas:**

1. **Projeto Next.js 14**
   - Criar projeto com App Router e TypeScript.
   - Configurar TailwindCSS, Recharts, React Icons.
   - Estrutura de pastas: `app/`, `components/`, `lib/`, `types/`, `actions/`.

2. **Supabase**
   - Criar projeto Supabase (ou usar existente).
   - Configurar variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` para server).

3. **Schema PostgreSQL (espelho dos modelos Django)**
   - Criar tabelas: `clients`, `categories`, `brands`, `products`, `stock`, `stock_movements`, `sells`, `sell_items`, `purchases`, `purchase_items`, `stock_transfers`, `returns`, `return_items`, `price_history`.
   - Enums para: status de venda, compra, transferência, devolução; tipo/motivo de movimentação; motivo de devolução; condição do produto; motivo de ajuste.
   - FKs e índices alinhados ao uso (listagens, filtros, relatórios).
   - `auth.users` do Supabase como referência para `user_id` em movimentações, compras, etc.

4. **Row Level Security (RLS)**
   - Políticas iniciais: leitura/escrita apenas para usuários autenticados (ou por role “admin”); ajustar depois conforme perfis.

5. **Tipos TypeScript**
   - Gerar ou escrever tipos a partir do schema (ex.: `Database` do Supabase + tipos para enums e DTOs).

**Entregáveis:** Repositório Next.js rodando, Supabase com tabelas e RLS básico, tipos TS alinhados ao schema.

---

### Fase 1: Autenticação e layout base (1–2 semanas)

**Objetivo:** Login/logout e shell da aplicação (layout, navegação, proteção de rotas).

**Tarefas:**

1. **Supabase Auth**
   - Configurar Auth no Supabase (email/senha; opcional: OAuth).
   - Em Next.js: `@supabase/ssr` para cookies (server/client); middleware de refresh de sessão.

2. **Páginas de auth**
   - `/login` (e se necessário `/logout`).
   - Redirect para dashboard após login; redirect para login em rotas protegidas.

3. **Layout principal**
   - Layout com sidebar/menu (espelhando atalhos do admin atual: Vendas, Produtos, Estoque, Movimentações, Compras, Categorias, Marcas, Clientes, Relatórios).
   - Uso de React Icons nos itens de menu.
   - Área de conteúdo com `children`.

4. **Proteção de rotas**
   - Middleware ou HOC/checagem em layout que redireciona não autenticados para `/login`.

**Entregáveis:** Login funcional, layout com menu e área de conteúdo, rotas protegidas.

---

### Fase 2: Cadastros base (2–3 semanas)

**Objetivo:** CRUD de Clientes, Categorias, Marcas e Produtos (incluindo estoque inicial).

**Tarefas:**

1. **Clientes**
   - Listagem (tabela) com busca e ordenação.
   - Página de criação/edição (formulário).
   - Server Actions para create/update/delete (com Supabase client server-side).

2. **Categorias**
   - Listagem + formulário de criação/edição (nome, descrição, preço padrão).

3. **Marcas**
   - Listagem + formulário de criação/edição.

4. **Produtos**
   - Listagem com filtros (marca, categoria, tamanho, etc.) e busca (nome, código de barras).
   - Formulário: nome, descrição, tamanho (enum), cor, preço de venda, marca, categoria, track_stock, barcode.
   - Integração com Stock: ao criar produto com `track_stock`, criar registro em `stock` (quantidade 0, min/max, localização, cost_price, lote, validade) ou tela de “estoque inicial” na edição do produto.

5. **Estoque (visão por produto)**
   - Na edição do produto: card ou seção “Estoque” (quantidade, min, max, localização, preço de custo, lote, validade) com edição inline ou modal.

**Entregáveis:** CRUD completo de Clientes, Categorias, Marcas e Produtos, com estoque inicial/edição vinculado ao produto.

---

### Fase 3: Estoque e movimentações (2–3 semanas)

**Objetivo:** Listagem de estoque, movimentações e ajuste manual.

**Tarefas:**

1. **Listagem de estoque**
   - Página “Estoque” com tabela: produto, quantidade, min, max, localização, preço de custo, valor total, status (OK / Estoque baixo / Sem estoque), validade.
   - Filtros: categoria, marca, status (baixo/sem estoque/OK), validade (vencido, próximo, válido).
   - Busca por nome, código de barras, localização.
   - Indicadores visuais (cores) para status.

2. **Movimentações**
   - Listagem de movimentações com filtros (tipo, motivo, produto, período, usuário).
   - Detalhe: quantidade antes/depois, referência, observações.
   - As movimentações continuam sendo criadas por regras de negócio (venda, compra, ajuste, etc.), não criação manual livre (ou restrita a admin).

3. **Ajuste de estoque**
   - Tela de ajuste (por produto/estoque): nova quantidade, motivo (INVENTARIO, PERDA, ACHADO, CORRECAO), observações.
   - Server Action: validar permissão, calcular diferença, inserir `stock_movements` e atualizar `stock.quantity` (ou usar função no DB para atomicidade).

4. **Histórico de preços**
   - Listagem ou aba “Histórico de preço” no produto/estoque (tabela `price_history`); registro via trigger ou Server Action ao alterar `cost_price`.

**Entregáveis:** Páginas de Estoque e Movimentações, tela de Ajuste e exibição de histórico de preços.

---

### Fase 4: Compras (entrada de mercadorias) (1,5–2 semanas)

**Objetivo:** Registrar compras e dar entrada no estoque.

**Tarefas:**

1. **Listagem de compras**
   - Tabela: id, fornecedor, data, NF, valor total, status (PENDENTE, RECEBIDA, CANCELADA), criado por.
   - Filtros por status, fornecedor, período.

2. **Formulário de compra**
   - Cabeçalho: fornecedor, número NF, data, observações.
   - Itens: produto (autocomplete), quantidade, preço unitário, subtotal (calculado).
   - Total da compra calculado.
   - Ao salvar: status PENDENTE.

3. **Receber mercadoria**
   - Ação “Receber” por compra: para cada item, criar/atualizar `stock`, criar `stock_movement` (ENTRADA, COMPRA), atualizar `cost_price` do estoque; opcionalmente registrar em `price_history`. Atualizar status da compra para RECEBIDA.

4. **Cancelar compra**
   - Se já RECEBIDA: reverter movimentações (SAIDA/AJUSTE) e ajustar estoque; status CANCELADA. Se PENDENTE: apenas marcar CANCELADA.

**Entregáveis:** CRUD de compras, recebimento e cancelamento com impacto correto no estoque.

---

### Fase 5: Vendas (2–3 semanas)

**Objetivo:** Registro de vendas com baixa automática de estoque.

**Tarefas:**

1. **Listagem de vendas**
   - Tabela: id, cliente, data, total, status (PENDENTE, CONCLUIDA, CANCELADA).
   - Filtros por status e período.

2. **Formulário de venda**
   - Cliente (select/autocomplete), itens: produto, quantidade, preço unitário (default: categoria > produto), subtotal.
   - Cálculo do total; validação de estoque antes de salvar (quantidade disponível >= quantidade do item).

3. **Confirmar venda**
   - Ação “Confirmar”: para cada item, criar movimentação de SAIDA (VENDA), atualizar `stock.quantity`; status CONCLUIDA.
   - Impedir confirmar se algum item estiver sem estoque suficiente.

4. **Cancelar venda**
   - Se CONCLUIDA: devolver estoque (movimentação ENTRADA, DEVOLUCAO_CLIENTE); status CANCELADA.
   - Atualizar total ao adicionar/remover/alterar itens (recalcular na ação de save).

5. **Exclusão de item da venda**
   - Se venda já CONCLUIDA: devolver estoque do item antes de remover.

**Entregáveis:** CRUD de vendas, confirmar/cancelar com baixa e devolução de estoque e validações.

---

### Fase 6: Transferências e devoluções (1,5–2 semanas)

**Objetivo:** Transferências entre localizações e devoluções de clientes.

**Tarefas:**

1. **Transferências**
   - Listagem: origem, destino, produto, quantidade, data, status (PENDENTE, CONCLUIDA, CANCELADA).
   - Formulário: produto, origem, destino, quantidade, observações.
   - Confirmar: validar estoque na origem; criar movimentações (saída origem, entrada destino); atualizar localização do estoque; status CONCLUIDA.
   - Cancelar: se já concluída, reverter movimentações e localização.

2. **Devoluções**
   - Listagem: venda, data, motivo, status (PENDENTE, APROVADA, REJEITADA).
   - Formulário: venda (select), motivo (DEFEITO, TROCA, DESISTENCIA, OUTRO), itens (item da venda, quantidade devolvida, condição, “repor no estoque”).
   - Validação: quantidade devolvida <= quantidade vendida por item.
   - Aprovar: para itens com “repor no estoque”, criar movimentação ENTRADA (DEVOLUCAO_CLIENTE); status APROVADA.
   - Rejeitar: status REJEITADA; se antes aprovada, reverter reposições (movimentação de saída).

**Entregáveis:** Fluxos completos de transferência e de devolução com impacto correto no estoque.

---

### Fase 7: Dashboard e relatórios (2–3 semanas)

**Objetivo:** Dashboard com métricas e gráficos (Recharts) e relatórios equivalentes aos atuais.

**Tarefas:**

1. **Dashboard**
   - Métricas: total de produtos em estoque, valor total do estoque, produtos com estoque baixo, sem estoque, vencidos, próximos do vencimento.
   - Gráficos Recharts: vendas (diário/semanal/mensal); estoque baixo por categoria; movimentações por tipo (últimos 30 dias).
   - Bloco de alertas: sem estoque, estoque baixo, vencidos, próximos do vencimento, movimentações “suspeitas” (ex.: quantidade absoluta alta em 24h).
   - Vendas recentes (tabela resumida).
   - Movimentações recentes.

2. **Relatório Estoque Atual**
   - Mesmos filtros da listagem de estoque; colunas: produto, marca, categoria, quantidade, min, localização, preço custo, valor total, status.
   - Exportação CSV (ou botão “Exportar” que gera arquivo).

3. **Relatório Movimentações**
   - Filtros: tipo, motivo, produto, data início/fim; agrupamento por tipo; export CSV.

4. **Relatório Estoque Baixo**
   - Produtos com quantidade <= min_quantity (excluindo zero); sugestão de compra; export CSV.

5. **Relatório Valor de Estoque**
   - Por categoria e por marca (total produtos, quantidade, valor); valor total geral; evolução (se houver dados históricos); export CSV.

**Entregáveis:** Dashboard com métricas e gráficos (Recharts) e quatro relatórios com exportação.

---

### Fase 8: Ajustes finais, testes e deploy (1–2 semanas)

**Objetivo:** Polimento, testes e publicação.

**Tarefas:**

1. **RLS e permissões**
   - Revisar políticas por tabela; diferenciar leitura/escrita por perfil se necessário (ex.: apenas admin pode ajustar estoque ou cancelar compra recebida).

2. **Performance**
   - Índices no Supabase conforme queries usadas; paginação em listagens grandes; evitar over-fetch (select apenas colunas necessárias).

3. **UX e acessibilidade**
   - Mensagens de sucesso/erro consistentes; loading states; labels e navegação por teclado; contraste e foco visível.

4. **Testes**
   - Testes críticos: criação de venda e confirmar (baixa estoque); cancelar venda (devolve); receber compra (entrada); ajuste de estoque; aprovar devolução (reposição).
   - Testes de integração ou E2E para fluxos principais (opcional).

5. **Migração de dados (se aplicável)**
   - Script (Node/TS ou Supabase Edge Function) para ler do SQLite/PostgreSQL Django e inserir no Supabase (usuários podem ser mapeados para `auth.users` ou tabela de perfis).
   - Executar em janela de manutenção; validar totais e amostras.

6. **Deploy**
   - Deploy Next.js (Vercel ou outro); variáveis de ambiente de produção; domínio e HTTPS.
   - Documentação mínima: como rodar em dev, variáveis necessárias, como executar migração de dados (se houver).

**Entregáveis:** RLS revisado, listagens paginadas, testes automatizados para regras críticas, plano de migração de dados (e script se necessário), app em produção.

---

## 4. Mapeamento resumido Django → Next.js/Supabase

| Django                     | Next.js / Supabase                                      |
|---------------------------|---------------------------------------------------------|
| `User` (auth)             | Supabase `auth.users` + tabela `profiles` se necessário |
| Models → migrations       | Tabelas e enums no PostgreSQL (Supabase)                 |
| Admin CRUD                | Páginas App Router + Server Actions                    |
| Views de relatórios       | Páginas em `app/relatorios/...` + Server Components    |
| Export CSV                 | Server Action que gera CSV e retorna download           |
| Signals (estoque/preço)    | Lógica em Server Actions ou DB triggers/functions       |
| Templates HTML            | React Components (Server/Client) + Tailwind             |
| Jazzmin / admin theme     | Layout próprio com Tailwind + React Icons              |

---

## 5. Estrutura de pastas sugerida (Next.js)

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # redirect para dashboard
│   ├── login/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # dashboard
│   │   ├── clientes/
│   │   ├── categorias/
│   │   ├── marcas/
│   │   ├── produtos/
│   │   ├── estoque/
│   │   ├── movimentacoes/
│   │   ├── compras/
│   │   ├── vendas/
│   │   ├── transferencias/
│   │   ├── devolucoes/
│   │   └── relatorios/
│   │       ├── estoque-atual/
│   │       ├── movimentacoes/
│   │       ├── estoque-baixo/
│   │       └── valor-estoque/
│   └── api/                        # se precisar de rotas API
├── components/
│   ├── ui/
│   ├── forms/
│   └── charts/
├── lib/
│   ├── supabase/
│   │   ├── server.ts
│   │   ├── client.ts
│   │   └── middleware.ts
│   └── utils.ts
├── types/
│   └── database.ts
└── actions/
    ├── clients.ts
    ├── products.ts
    ├── stock.ts
    ├── sells.ts
    ├── purchases.ts
    └── ...
```

---

## 6. Riscos e mitigações

| Risco                         | Mitigação                                                |
|------------------------------|----------------------------------------------------------|
| Diferença de comportamento   | Replicar regras em Server Actions e testes automatizados |
| Migração de dados incorreta  | Script idempotente; validar totais e amostras; backup    |
| RLS mal configurado           | Testar com usuários diferentes; documentar políticas    |
| Performance em listagens     | Paginação, índices e queries enxutas desde a Fase 2     |

---

## 7. Ordem sugerida de execução

1. **Fase 0** – Preparação e ambiente  
2. **Fase 1** – Autenticação e layout  
3. **Fase 2** – Cadastros base  
4. **Fase 3** – Estoque e movimentações  
5. **Fase 4** – Compras  
6. **Fase 5** – Vendas  
7. **Fase 6** – Transferências e devoluções  
8. **Fase 7** – Dashboard e relatórios  
9. **Fase 8** – Ajustes, testes e deploy  

Cada fase deve ser concluída e testada antes de avançar. Commits pequenos e descritivos facilitam rollback e revisão.

---

**Última atualização:** 2025-03-10  
**Versão do documento:** 1.0
