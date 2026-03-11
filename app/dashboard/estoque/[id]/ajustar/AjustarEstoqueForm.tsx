"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { adjustStockAction, type AdjustStockFormState, type AdjustmentReason } from "@/actions/stock";
import { SubmitButton } from "@/components/ui/SubmitButton";

interface AjustarEstoqueFormProps {
  stockId: number;
  currentQuantity: number;
  /** Estoque mínimo atual (para alerta de estoque baixo). */
  currentMinQuantity?: number;
  /** Quando true, oculta o link Cancelar (sidebar tem seu próprio fechamento). */
  inSlideOver?: boolean;
}

const REASONS: { value: AdjustmentReason; label: string }[] = [
  { value: "INVENTARIO", label: "Inventário" },
  { value: "PERDA", label: "Perda" },
  { value: "ACHADO", label: "Achado" },
  { value: "CORRECAO", label: "Correção" },
];

export function AjustarEstoqueForm({ stockId, currentQuantity, currentMinQuantity = 0, inSlideOver }: AjustarEstoqueFormProps) {
  const [state, formAction] = useFormState<AdjustStockFormState, FormData>(
    (prev, formData) => adjustStockAction(stockId, prev, formData),
    {}
  );

  return (
    <form action={formAction} className="max-w-md space-y-4">
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      <label className="block">
        <span className="text-sm font-medium text-bmq-dark">Nova quantidade</span>
        <input
          type="number"
          name="new_quantity"
          min={0}
          defaultValue={currentQuantity}
          required
          className="mt-1 block w-full rounded-lg border border-bmq-border px-3 py-2 focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-bmq-dark">Estoque mínimo</span>
        <input
          type="number"
          name="min_quantity"
          min={0}
          defaultValue={currentMinQuantity}
          className="mt-1 block w-full rounded-lg border border-bmq-border px-3 py-2 focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
        />
        <p className="mt-0.5 text-xs text-bmq-mid-dark">Quando a quantidade atingir este valor, o sistema marcará como estoque baixo.</p>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-bmq-dark">Motivo</span>
        <select
          name="reason"
          required
          className="mt-1 block w-full rounded-lg border border-bmq-border px-3 py-2 focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
        >
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-bmq-dark">Observações (opcional)</span>
        <textarea
          name="notes"
          rows={3}
          className="mt-1 block w-full rounded-lg border border-bmq-border px-3 py-2 focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
        />
      </label>
      <div className="flex gap-3">
        <SubmitButton loadingText="Aplicando…">
          Aplicar ajuste
        </SubmitButton>
        {!inSlideOver && (
          <Link
            href="/dashboard/estoque"
            className="rounded-lg border border-bmq-border px-4 py-2 text-sm font-medium text-bmq-dark hover:bg-bmq-mid/20"
          >
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
