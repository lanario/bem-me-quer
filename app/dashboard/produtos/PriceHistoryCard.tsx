import type { Tables } from "@/types/database";

interface PriceHistoryCardProps {
  history: Tables<"price_history">[];
}

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

/**
 * Exibe o histórico de preço de custo do estoque do produto.
 */
export function PriceHistoryCard({ history }: PriceHistoryCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Histórico de preço de custo</h2>
      {history.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum registro de alteração de preço.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Data</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Preço (R$)</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {history.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">{formatDateTime(row.created_at)}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">R$ {Number(row.cost_price).toFixed(2)}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{row.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
