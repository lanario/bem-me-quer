import { createClient } from "@/lib/supabase/server";
import { RelatoriosTabs } from "../RelatoriosTabs";
import { MovimentacoesFilters } from "../../movimentacoes/MovimentacoesFilters";
import { ExportCsvButton } from "@/components/reports/ExportCsvButton";
import { ExportPdfButton } from "@/components/reports/ExportPdfButton";
import { getMovimentacoesCsv } from "@/actions/reports";
import { getMovimentacoesPdf } from "@/actions/reports-pdf";
import type { MovementType, MovementReason } from "@/types/database";

type MovementRow = {
  id: number;
  created_at: string;
  movement_type: MovementType;
  reason: MovementReason;
  quantity: number;
  quantity_before: number | null;
  reference: string | null;
  notes: string | null;
  stock?: { products?: { title: string } | null } | null;
};

export default async function RelatorioMovimentacoesPage({
  searchParams,
}: {
  searchParams: Promise<{
    tipo?: string;
    motivo?: string;
    produto?: string;
    data_inicio?: string;
    data_fim?: string;
  }>;
}) {
  const params = await searchParams;
  const { tipo = "", motivo = "", produto = "", data_inicio = "", data_fim = "" } = params;
  const supabase = await createClient();

  const { data: productsData } = await supabase.from("products").select("id, title").order("title");
  const productOptions = (productsData ?? []) as { id: number; title: string }[];

  let query = supabase
    .from("stock_movements")
    .select("*, stock(products(title))")
    .order("created_at", { ascending: false });
  if (tipo) query = query.eq("movement_type", tipo as MovementType);
  if (motivo) query = query.eq("reason", motivo as MovementReason);
  if (produto) {
    const { data: stockIds } = await supabase.from("stock").select("id").eq("product_id", Number(produto));
    const ids = (stockIds ?? []).map((s) => (s as { id: number }).id);
    if (ids.length) query = query.in("stock_id", ids);
    else query = query.eq("stock_id", -1);
  }
  if (data_inicio) query = query.gte("created_at", `${data_inicio}T00:00:00`);
  if (data_fim) query = query.lte("created_at", `${data_fim}T23:59:59`);

  const { data } = await query;
  const movements = (data ?? []) as MovementRow[];

  const byType: Record<string, number> = {};
  for (const m of movements) {
    byType[m.movement_type] = (byType[m.movement_type] ?? 0) + 1;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-bmq-dark mb-2">Relatórios</h1>
      <p className="text-bmq-mid-dark mb-4">Visão financeira e operacional por período.</p>
      <RelatoriosTabs currentTab="movimentacoes" />
      <div className="flex justify-end gap-2 mb-6">
        <ExportCsvButton exportAction={getMovimentacoesCsv} exportParams={params} label="Exportar CSV" />
        <ExportPdfButton exportAction={getMovimentacoesPdf} exportParams={params} label="Exportar PDF" />
      </div>
      <h2 className="text-lg font-semibold text-bmq-dark mb-4">Movimentações</h2>
      <MovimentacoesFilters
        tipoDefault={tipo}
        motivoDefault={motivo}
        produtoDefault={produto}
        dataInicioDefault={data_inicio}
        dataFimDefault={data_fim}
        productOptions={productOptions}
        basePath="/dashboard/relatorios/movimentacoes"
      />
      <p className="mt-2 text-sm text-bmq-mid-dark">Filtros aplicam-se à tabela e ao CSV exportado. Para relatório por tipo, veja o resumo abaixo.</p>
      <div className="mt-4 rounded-lg border border-bmq-border bg-bmq-bg p-4">
        <h3 className="text-sm font-semibold text-bmq-dark mb-2">Agrupamento por tipo</h3>
        <ul className="text-sm text-bmq-mid-dark space-y-1">
          {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
            <li key={type}>{type}: {count} movimentação(ões)</li>
          ))}
          {Object.keys(byType).length === 0 && <li>Nenhuma movimentação no período</li>}
        </ul>
      </div>
      <div className="mt-4 overflow-x-auto rounded-lg border border-bmq-border bg-white">
        <table className="min-w-full divide-y divide-bmq-border">
          <thead className="bg-bmq-bg">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Data</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Produto</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Tipo</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-bmq-mid-dark">Qtd</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Motivo</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Referência</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bmq-border">
            {movements.map((m) => (
              <tr key={m.id} className="hover:bg-bmq-bg">
                <td className="px-4 py-3 text-sm text-bmq-dark whitespace-nowrap">
                  {new Date(m.created_at).toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-3 text-sm text-bmq-dark">{m.stock?.products?.title ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-bmq-mid-dark">{m.movement_type}</td>
                <td className="px-4 py-3 text-sm text-right text-bmq-dark">{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                <td className="px-4 py-3 text-sm text-bmq-mid-dark">{m.reason}</td>
                <td className="px-4 py-3 text-sm text-bmq-mid-dark truncate max-w-[140px]" title={m.reference ?? undefined}>{m.reference ?? "—"}</td>
              </tr>
            ))}
            {movements.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-bmq-mid-dark">Nenhuma movimentação.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
