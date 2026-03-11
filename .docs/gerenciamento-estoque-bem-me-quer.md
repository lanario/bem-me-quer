# Sistema de Gerenciamento de Estoque - Bem Me Quer

## Visão Geral

Este documento descreve o plano de implementação de um sistema completo de gerenciamento de estoques para o app `bem_me_quer`. O sistema será desenvolvido em fases, permitindo implementação incremental e testes contínuos.

---

## Fase 1: Modelos Base de Estoque

### Objetivo

Criar a estrutura fundamental de dados para controle de estoque.

### Tarefas

#### 1.1 Modelo `Stock` (Estoque)

- **Campos:**

  - `product` (ForeignKey para Products) - Produto relacionado
  - `quantity` (PositiveIntegerField) - Quantidade atual em estoque
  - `min_quantity` (PositiveIntegerField) - Quantidade mínima (alerta)
  - `max_quantity` (PositiveIntegerField) - Quantidade máxima
  - `location` (CharField, opcional) - Localização física (prateleira, armazém)
  - `cost_price` (DecimalField) - Preço de custo do produto
  - `last_updated` (DateTimeField, auto_now=True) - Última atualização
  - `created_at` (DateTimeField, auto_now_add=True) - Data de criação

- **Métodos:**
  - `is_low_stock()` - Retorna True se quantidade <= min_quantity
  - `is_out_of_stock()` - Retorna True se quantidade == 0
  - `available_quantity()` - Retorna quantidade disponível para venda
  - `__str__()` - Representação: "Produto X - Qtd: Y"

#### 1.2 Modelo `StockMovement` (Movimentação de Estoque)

- **Campos:**

  - `stock` (ForeignKey para Stock) - Estoque relacionado
  - `movement_type` (CharField com choices) - Tipo: ENTRADA, SAIDA, AJUSTE, DEVOLUCAO
  - `quantity` (IntegerField) - Quantidade movimentada (positivo ou negativo)
  - `reason` (CharField com choices) - Motivo: COMPRA, VENDA, AJUSTE, PERDA, DEVOLUCAO_CLIENTE
  - `reference` (CharField, opcional) - Referência externa (NF, pedido, etc.)
  - `notes` (TextField, opcional) - Observações
  - `user` (ForeignKey para User, opcional) - Usuário que fez a movimentação
  - `created_at` (DateTimeField, auto_now_add=True) - Data/hora da movimentação

- **Métodos:**
  - `get_quantity_before()` - Quantidade antes da movimentação
  - `get_quantity_after()` - Quantidade depois da movimentação
  - `__str__()` - Representação: "Tipo - Produto - Qtd: X"

#### 1.3 Atualização do Modelo `Products`

- Adicionar campo `track_stock` (BooleanField) - Se deve rastrear estoque
- Adicionar método `get_stock()` - Retorna objeto Stock relacionado
- Adicionar método `has_stock()` - Verifica se tem estoque disponível

#### 1.4 Migrations

- Criar migration para novos modelos
- Executar `makemigrations` e `migrate`

### Entregáveis

- Modelos `Stock` e `StockMovement` criados
- Modelo `Products` atualizado
- Migrations aplicadas
- Testes básicos de criação de objetos

---

## Fase 2: Integração com Vendas

### Objetivo

Integrar o sistema de estoque com o processo de vendas existente.

### Tarefas

#### 2.1 Atualização do Modelo `SellItem`

- Adicionar validação: verificar estoque antes de salvar
- Adicionar método `reserve_stock()` - Reserva estoque ao criar item
- Adicionar método `release_stock()` - Libera estoque ao deletar item

#### 2.2 Atualização do Modelo `Sell`

- Adicionar status: PENDENTE, CONCLUIDA, CANCELADA
- Adicionar método `confirm_sale()` - Confirma venda e baixa estoque
- Adicionar método `cancel_sale()` - Cancela venda e devolve estoque

#### 2.3 Signals (Django Signals)

- Criar signal `post_save` para `SellItem` - Baixa automática de estoque
- Criar signal `pre_delete` para `SellItem` - Devolve estoque ao deletar
- Criar signal `post_save` para `Sell` - Atualiza status e movimentações

#### 2.4 Validações

- Impedir venda se produto não tem estoque suficiente
- Mostrar alerta se estoque está baixo
- Validar quantidade mínima de venda

### Entregáveis

- Vendas integradas com controle de estoque
- Baixa automática ao confirmar venda
- Devolução automática ao cancelar venda
- Validações de estoque funcionando

---

## Fase 3: Interface Admin - Gestão de Estoque

### Objetivo

Criar interface administrativa completa para gerenciar estoques.

### Tarefas

#### 3.1 Admin para `Stock`

- **List Display:**
  - Produto, Quantidade, Quantidade Mínima, Status (com cores)
  - Localização, Preço de Custo, Última Atualização
- **Filtros:**
  - Por produto, marca, categoria
  - Estoque baixo, sem estoque
  - Por localização
- **Busca:**
  - Por nome do produto, código, marca
- **Ações customizadas:**
  - "Ajustar Estoque" - Permite ajuste manual
  - "Importar Estoque" - Importação em lote
  - "Exportar Relatório" - Exporta para CSV/Excel

#### 3.2 Admin para `StockMovement`

- **List Display:**
  - Data, Produto, Tipo, Quantidade, Motivo, Usuário
- **Filtros:**
  - Por tipo de movimentação
  - Por data (hierarquia)
  - Por produto
  - Por usuário
- **Readonly:**
  - Campos calculados (quantidade antes/depois)
- **Formulário:**
  - Campo de seleção de produto com autocomplete
  - Validação de quantidade baseada no tipo

#### 3.3 Dashboard de Estoque

- Criar template customizado para dashboard
- **Métricas:**
  - Total de produtos em estoque
  - Valor total do estoque (quantidade × preço de custo)
  - Produtos com estoque baixo
  - Produtos sem estoque
  - Movimentações recentes (últimas 10)
- **Gráficos:**
  - Gráfico de produtos com estoque baixo
  - Gráfico de movimentações por tipo (últimos 30 dias)
  - Gráfico de valor de estoque ao longo do tempo

#### 3.4 Inline no Admin de Products

- Adicionar `StockInline` no `ProductsAdmin`
- Permitir gerenciar estoque diretamente na edição do produto

### Entregáveis

- Interface admin completa para Stock
- Interface admin completa para StockMovement
- Dashboard com métricas e gráficos
- Inline de estoque no admin de produtos

---

## Fase 4: Entrada de Mercadorias

### Objetivo

Sistema completo para registrar entrada de produtos no estoque.

### Tarefas

#### 4.1 Modelo `Purchase` (Compra/Entrada)

- **Campos:**
  - `supplier` (CharField) - Fornecedor
  - `invoice_number` (CharField, opcional) - Número da nota fiscal
  - `purchase_date` (DateField) - Data da compra
  - `total_value` (DecimalField) - Valor total da compra
  - `status` (CharField com choices) - PENDENTE, RECEBIDA, CANCELADA
  - `notes` (TextField, opcional) - Observações
  - `created_by` (ForeignKey para User) - Usuário que criou
  - `created_at` (DateTimeField, auto_now_add=True)

#### 4.2 Modelo `PurchaseItem` (Itens da Compra)

- **Campos:**

  - `purchase` (ForeignKey para Purchase)
  - `product` (ForeignKey para Products)
  - `quantity` (PositiveIntegerField) - Quantidade comprada
  - `unit_cost` (DecimalField) - Preço unitário de custo
  - `subtotal` (DecimalField) - Subtotal (quantity × unit_cost)

- **Métodos:**
  - `save()` - Calcula subtotal e atualiza total da compra
  - `receive_stock()` - Recebe estoque e cria movimentação

#### 4.3 Admin para Purchase

- **List Display:**
  - Número, Fornecedor, Data, Valor Total, Status
- **Filtros:**
  - Por fornecedor, data, status
- **Inlines:**
  - `PurchaseItemInline` - Para adicionar produtos da compra
- **Ações:**
  - "Receber Mercadoria" - Confirma recebimento e atualiza estoque
  - "Cancelar Compra" - Cancela e reverte movimentações

#### 4.4 Fluxo de Entrada

1. Criar Purchase com fornecedor e data
2. Adicionar PurchaseItems (produtos, quantidades, preços)
3. Salvar compra (status: PENDENTE)
4. Ao receber: atualizar estoque e criar movimentações
5. Atualizar preço de custo no Stock

### Entregáveis

- Modelos Purchase e PurchaseItem
- Interface admin para compras
- Fluxo completo de entrada de mercadorias
- Atualização automática de estoque e preço de custo

---

## Fase 5: Relatórios e Alertas

### Objetivo

Criar sistema de relatórios e alertas para gestão de estoque.

### Tarefas

#### 5.1 Relatórios

- **Relatório de Estoque Atual:**
  - Lista todos os produtos com quantidade, valor, status
  - Filtros por categoria, marca, status
  - Exportação para PDF/Excel
- **Relatório de Movimentações:**
  - Histórico de todas as movimentações
  - Filtros por período, tipo, produto
  - Agrupamento por tipo de movimentação
- **Relatório de Produtos com Estoque Baixo:**
  - Lista produtos abaixo da quantidade mínima
  - Sugestão de compra (quantidade sugerida)
- **Relatório de Valor de Estoque:**
  - Valor total por categoria
  - Valor total por marca
  - Evolução do valor ao longo do tempo

#### 5.2 Alertas

- **Sistema de Notificações:**
  - Alerta no dashboard para produtos com estoque baixo
  - Alerta para produtos sem estoque
  - Alerta para movimentações suspeitas (grandes quantidades)
- **Email/Notificações:**
  - Enviar email quando estoque atinge mínimo
  - Relatório semanal de estoque baixo
  - Notificação de movimentações importantes

#### 5.3 Views Customizadas

- Criar views para relatórios
- Templates para impressão de relatórios
- Endpoints de API para dados dos relatórios (se necessário)

### Entregáveis

- 4 tipos de relatórios funcionando
- Sistema de alertas no dashboard
- Notificações por email (opcional)
- Views e templates de relatórios

---

## Fase 6: Ajustes e Transferências

### Objetivo

Permitir ajustes manuais de estoque e transferências entre localizações.

### Tarefas

#### 6.1 Ajustes de Estoque

- **Interface de Ajuste:**
  - Formulário para ajustar quantidade
  - Seleção de motivo: INVENTARIO, PERDA, ACHADO, CORRECAO
  - Campo de observações obrigatório
  - Confirmação antes de aplicar
- **Validações:**
  - Requer permissão especial para ajustes
  - Log de quem fez o ajuste
  - Não permitir ajustes negativos sem motivo justificado

#### 6.2 Transferências entre Localizações

- **Modelo `StockTransfer` (Transferência):**
  - `from_location` (CharField) - Origem
  - `to_location` (CharField) - Destino
  - `product` (ForeignKey para Products)
  - `quantity` (PositiveIntegerField)
  - `transfer_date` (DateTimeField)
  - `status` (CharField) - PENDENTE, CONCLUIDA, CANCELADA
  - `notes` (TextField, opcional)
- **Fluxo:**
  1. Criar transferência (origem, destino, produto, quantidade)
  2. Validar se origem tem estoque suficiente
  3. Ao confirmar: debita origem, credita destino
  4. Cria movimentações em ambas as localizações

#### 6.3 Admin para Transferências

- List display com origem, destino, produto, quantidade, status
- Filtros por localização, produto, data
- Ação "Confirmar Transferência"

### Entregáveis

- Sistema de ajustes de estoque
- Sistema de transferências entre localizações
- Interface admin para transferências
- Validações e permissões implementadas

---

## Fase 7: Devoluções e Trocas

### Objetivo

Gerenciar devoluções de clientes e reposição no estoque.

### Tarefas

#### 7.1 Modelo `Return` (Devolução)

- **Campos:**
  - `sell` (ForeignKey para Sell) - Venda relacionada
  - `return_date` (DateTimeField) - Data da devolução
  - `reason` (CharField com choices) - DEFEITO, TROCA, DESISTENCIA, OUTRO
  - `status` (CharField) - PENDENTE, APROVADA, REJEITADA
  - `notes` (TextField) - Observações
  - `processed_by` (ForeignKey para User, opcional)

#### 7.2 Modelo `ReturnItem` (Itens Devolvidos)

- **Campos:**
  - `return` (ForeignKey para Return)
  - `sell_item` (ForeignKey para SellItem) - Item original da venda
  - `quantity` (PositiveIntegerField) - Quantidade devolvida
  - `condition` (CharField com choices) - NOVO, USADO, DANIFICADO
  - `restock` (BooleanField) - Se deve voltar ao estoque

#### 7.3 Fluxo de Devolução

1. Cliente solicita devolução de uma venda
2. Criar Return vinculado à Sell
3. Adicionar ReturnItems (quais produtos, quantidades)
4. Definir condição dos produtos
5. Decidir se produtos voltam ao estoque (restock=True)
6. Ao aprovar: atualizar estoque se restock=True
7. Criar movimentação de tipo DEVOLUCAO_CLIENTE

#### 7.4 Admin para Returns

- List display com venda, data, motivo, status
- Inline para ReturnItems
- Ações: "Aprovar Devolução", "Rejeitar Devolução"
- Filtros por status, data, venda

### Entregáveis

- Modelos Return e ReturnItem
- Fluxo completo de devoluções
- Interface admin para devoluções
- Integração com estoque (reposição condicional)

---

## Fase 8: Otimizações e Melhorias

### Objetivo

Otimizar performance, adicionar funcionalidades avançadas e melhorar UX.

### Tarefas

#### 8.1 Performance

- Adicionar índices nos campos mais consultados
- Otimizar queries com `select_related` e `prefetch_related`
- Cache para relatórios pesados
- Paginação em listas grandes

#### 8.2 Funcionalidades Avançadas

- **Histórico de Preços:**
  - Modelo para armazenar histórico de preços de custo
  - Gráfico de evolução de preços
- **Lote/Validade:**
  - Adicionar campos de lote e validade no Stock
  - Controle de produtos próximos do vencimento
  - Alerta de produtos vencidos
- **Código de Barras:**
  - Campo barcode no Products
  - Busca por código de barras
  - Impressão de etiquetas

#### 8.3 Melhorias de UX

- Autocomplete melhorado
- Validações em tempo real
- Mensagens de sucesso/erro mais claras
- Atalhos de teclado no admin
- Interface responsiva

#### 8.4 Testes

- Testes unitários para modelos
- Testes de integração para fluxos
- Testes de performance
- Cobertura mínima de 80%

### Entregáveis

- Sistema otimizado e performático
- Funcionalidades avançadas implementadas
- UX melhorada
- Suite de testes completa

---

## Considerações Técnicas

### Dependências Adicionais

- `django-extensions` (para comandos úteis)
- `reportlab` ou `weasyprint` (para PDFs)
- `openpyxl` ou `xlsxwriter` (para Excel)
- `django-crispy-forms` (para formulários mais bonitos, opcional)

### Estrutura de Arquivos Sugerida

```
bem_me_quer/
├── models.py (modelos principais)
├── admin.py (configurações admin)
├── signals.py (signals do Django)
├── forms.py (formulários customizados)
├── views.py (views customizadas se necessário)
├── utils.py (funções auxiliares)
├── management/
│   └── commands/
│       └── update_stock.py (comandos customizados)
└── templates/
    └── bem_me_quer/
        ├── admin/
        │   ├── stock_dashboard.html
        │   └── stock_report.html
        └── ...
```

### Permissões Sugeridas

- `can_view_stock` - Visualizar estoque
- `can_manage_stock` - Gerenciar estoque
- `can_adjust_stock` - Fazer ajustes
- `can_receive_purchase` - Receber compras
- `can_process_returns` - Processar devoluções

### Ordem de Implementação Recomendada

1. Fase 1 (Fundação)
2. Fase 2 (Integração)
3. Fase 3 (Interface)
4. Fase 4 (Entradas)
5. Fase 5 (Relatórios)
6. Fase 6 (Ajustes)
7. Fase 7 (Devoluções)
8. Fase 8 (Otimizações)

---

## Notas Finais

- Cada fase deve ser testada antes de avançar para a próxima
- Fazer commits frequentes e descritivos
- Documentar decisões importantes
- Considerar backup antes de migrations importantes
- Manter comunicação com stakeholders sobre progresso

---

**Última atualização:** 2025-12-22
**Versão do documento:** 1.0
