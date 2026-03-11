import { createClient } from "@/lib/supabase/server";
import { MovimentacoesFilters } from "./MovimentacoesFilters";
import { PaginationBar } from "@/components/ui/PaginationBar";
import type { MovementReason, MovementType, Tables } from "@/types/database";

const PAGE_SIZE = 20;

type MovementRow = Tables<"stock_movements"> & {
  stock?: { product_id: number; products?: { title: string } | null } | null;
};

function formatDateTime(value: string): string {
  try {
    return new Date(value).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

export default async function MovimentacoesPage({
  searchParams,
}: {
  searchParams: Promise<{
    tipo?: string;
    motivo?: string;
    produto?: string;
    data_inicio?: string;
    data_fim?: string;
    page?: string;
  }>;
}) {
  const { tipo = "", motivo = "", produto = "", data_inicio = "", data_fim = "", page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const supabase = await createClient();

  const { data: productsData } = await supabase
    .from("products")
    .select("id, title")
    .order("title");
  const productOptions = (productsData ?? []) as { id: number; title: string }[];

  let query = supabase
    .from("stock_movements")
    .select("*, stock(product_id, products(title))", { count: "exact" })
    .order("created_at", { ascending: false });

  if (tipo) query = query.eq("movement_type", tipo as MovementType);
  if (motivo) query = query.eq("reason", motivo as MovementReason);
  if (produto) {
    const { data: stockIds } = await supabase.from("stock").select("id").eq("product_id", Number(produto));
    const ids = (stockIds ?? []).map((s) => s.id);
    if (ids.length > 0) query = query.in("stock_id", ids);
    else query = query.eq("stock_id", -1);
  }
  if (data_inicio) query = query.gte("created_at", `${data_inicio}T00:00:00`);
  if (data_fim) query = query.lte("created_at", `${data_fim}T23:59:59`);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: rawData, error, count } = await query.range(from, to);

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">Erro ao carregar movimentações: {error.message}</p>
      </div>
    );
  }

  const movements = (rawData ?? []) as MovementRow[];
  const total = count ?? 0;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Movimentações de estoque</h1>

      <MovimentacoesFilters
        tipoDefault={tipo}
        motivoDefault={motivo}
        produtoDefault={produto}
        dataInicioDefault={data_inicio}
        dataFimDefault={data_fim}
        productOptions={productOptions}
      />

      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Data</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Produto</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Qtd</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Motivo</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Referência</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Antes / Depois</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Observações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {movements.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  Nenhuma movimentação encontrada.
                </td>
              </tr>
            ) : (
              movements.map((m) => {
                const productTitle = m.stock?.products?.title ?? "—";
                const qtyAfter = m.quantity_before != null ? m.quantity_before + m.quantity : "—";
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{formatDateTime(m.created_at)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{productTitle}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{m.movement_type}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{m.reason}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{m.reference ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {m.quantity_before != null ? `${m.quantity_before} → ${qtyAfter}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={m.notes ?? undefined}>
                      {m.notes ?? "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <PaginationBar
        total={total}
        pageSize={PAGE_SIZE}
        currentPage={page}
        basePath="/dashboard/movimentacoes"
      />
    </div>
  );
}
