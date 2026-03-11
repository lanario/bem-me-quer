"use client";

import { useFormState } from "react-dom";
import { updateStockAction } from "@/actions/products";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { Tables } from "@/types/database";

interface ProductStockCardProps {
  productId: number;
  stocks: Tables<"stock">[];
  locationsMap: Map<number, string>;
}

function formatDate(value: string | null): string {
  if (!value) return "";
  try {
    const d = new Date(value);
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function StockRowForm({
  stock,
  locationName,
}: {
  stock: Tables<"stock">;
  locationName: string;
}) {
  const [state, formAction] = useFormState(
    (_: { error?: string }, formData: FormData) => {
      const stockId = Number(formData.get("stock_id"));
      return updateStockAction(stockId, formData);
    },
    {}
  );

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-gray-100 bg-gray-50/50 p-4">
      <input type="hidden" name="stock_id" value={stock.id} />
      <p className="text-sm font-medium text-gray-700">Local: {locationName}</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
          <input
            name="quantity"
            type="number"
            min={0}
            defaultValue={stock.quantity}
            className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Qtd. mínima</label>
          <input
            name="min_quantity"
            type="number"
            min={0}
            defaultValue={stock.min_quantity}
            className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Qtd. máxima</label>
          <input
            name="max_quantity"
            type="number"
            min={0}
            defaultValue={stock.max_quantity ?? ""}
            placeholder="Opcional"
            className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Localização (texto)</label>
          <input
            name="location"
            type="text"
            maxLength={100}
            defaultValue={stock.location ?? ""}
            placeholder="Ex: Prateleira A1"
            className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preço de custo (R$)</label>
          <input
            name="cost_price"
            type="text"
            inputMode="decimal"
            min={0}
            defaultValue={stock.cost_price}
            className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lote</label>
          <input
            name="batch_number"
            type="text"
            maxLength={50}
            defaultValue={stock.batch_number ?? ""}
            className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Validade</label>
          <input
            name="expiry_date"
            type="date"
            defaultValue={formatDate(stock.expiry_date ?? null)}
            className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent"
          />
        </div>
      </div>
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}
      <SubmitButton loadingText="Atualizando…">Atualizar este local</SubmitButton>
    </form>
  );
}

export function ProductStockCard({ productId, stocks, locationsMap }: ProductStockCardProps) {
  const totalQuantity = stocks.reduce((acc, s) => acc + s.quantity, 0);
  const totalValue = stocks.reduce((acc, s) => acc + s.quantity * Number(s.cost_price), 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Estoque por localização</h2>
      <p className="text-sm text-gray-600 mb-4">
        Total do produto: <strong>{totalQuantity}</strong> un. · Valor total:{" "}
        <strong>R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
      </p>
      {stocks.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum registro de estoque. Ative &quot;Rastrear estoque&quot; e salve o produto para criar na localização Principal.</p>
      ) : (
        <div className="space-y-4">
          {stocks.map((stock) => (
            <StockRowForm
              key={stock.id}
              stock={stock}
              locationName={locationsMap.get(stock.location_id) ?? stock.location ?? "—"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
