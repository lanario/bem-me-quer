"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import { createReturnAction, getSellItemsForReturn, type SellItemForReturn } from "@/actions/returns";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ReturnReason } from "@/types/database";

interface ReturnFormProps {
  sells: { id: number; label: string }[];
  inSlideOver?: boolean;
}

const REASONS: { value: ReturnReason; label: string }[] = [
  { value: "DEFEITO", label: "Defeito" },
  { value: "TROCA", label: "Troca" },
  { value: "DESISTENCIA", label: "Desistência" },
  { value: "OUTRO", label: "Outro" },
];

const CONDITIONS: { value: "NOVO" | "USADO" | "DANIFICADO"; label: string }[] = [
  { value: "NOVO", label: "Novo" },
  { value: "USADO", label: "Usado" },
  { value: "DANIFICADO", label: "Danificado" },
];

export function ReturnForm({ sells, inSlideOver }: ReturnFormProps) {
  const [sellId, setSellId] = useState<number>(0);
  const [items, setItems] = useState<SellItemForReturn[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [conditions, setConditions] = useState<Record<number, "NOVO" | "USADO" | "DANIFICADO">>({});
  const [restocks, setRestocks] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!sellId) {
      setItems([]);
      setQuantities({});
      setConditions({});
      setRestocks({});
      return;
    }
    getSellItemsForReturn(sellId).then((data) => {
      setItems(data);
      const q: Record<number, number> = {};
      const c: Record<number, "NOVO" | "USADO" | "DANIFICADO"> = {};
      const r: Record<number, boolean> = {};
      data.forEach((i) => {
        q[i.id] = i.quantity;
        c[i.id] = "USADO";
        r[i.id] = true;
      });
      setQuantities(q);
      setConditions(c);
      setRestocks(r);
    });
  }, [sellId]);

  const updateQty = useCallback((sellItemId: number, value: number) => {
    const item = items.find((i) => i.id === sellItemId);
    const max = item?.quantity ?? 0;
    setQuantities((prev) => ({ ...prev, [sellItemId]: Math.max(0, Math.min(max, value)) }));
  }, [items]);

  const updateCondition = useCallback((sellItemId: number, value: "NOVO" | "USADO" | "DANIFICADO") => {
    setConditions((prev) => ({ ...prev, [sellItemId]: value }));
  }, []);

  const toggleRestock = useCallback((sellItemId: number) => {
    setRestocks((prev) => ({ ...prev, [sellItemId]: !prev[sellItemId] }));
  }, []);

  const [state, formAction] = useFormState(createReturnAction, {});

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="rounded-xl border border-bmq-border bg-white p-6">
        <h2 className="text-lg font-semibold text-bmq-dark mb-4">Venda e motivo</h2>
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-bmq-dark">Venda *</span>
            <select
              name="sell_id"
              required
              value={sellId || ""}
              onChange={(e) => setSellId(Number(e.target.value))}
              className="mt-1 block w-full rounded-lg border border-bmq-border px-3 py-2 focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
            >
              <option value="">Selecione a venda</option>
              {sells.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-bmq-dark">Motivo *</span>
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
            <span className="text-sm font-medium text-bmq-dark">Observações</span>
            <textarea
              name="notes"
              rows={2}
              className="mt-1 block w-full rounded-lg border border-bmq-border px-3 py-2 focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
            />
          </label>
        </div>
      </div>

      {items.length > 0 && (
        <div className="rounded-xl border border-bmq-border bg-white p-6">
          <h2 className="text-lg font-semibold text-bmq-dark mb-4">Itens a devolver</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-bmq-border">
              <thead className="bg-bmq-bg">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-bmq-mid-dark">Produto</th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase text-bmq-mid-dark">Vendido</th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase text-bmq-mid-dark">Qtd devolver</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-bmq-mid-dark">Condição</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-bmq-mid-dark">Repor estoque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bmq-border">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-sm text-bmq-dark">{item.products?.title ?? "—"}</td>
                    <td className="px-4 py-2 text-sm text-right text-bmq-dark">{item.quantity}</td>
                    <td className="px-4 py-2">
                      <input
                        type="hidden"
                        name="item_sell_item_id"
                        value={item.id}
                      />
                      <input
                        type="number"
                        name="item_quantity"
                        min={0}
                        max={item.quantity}
                        value={quantities[item.id] ?? 0}
                        onChange={(e) => updateQty(item.id, Number(e.target.value))}
                        className="w-20 rounded-lg border border-bmq-border px-2 py-1.5 text-sm text-right focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        name="item_condition"
                        value={conditions[item.id] ?? "USADO"}
                        onChange={(e) => updateCondition(item.id, e.target.value as "NOVO" | "USADO" | "DANIFICADO")}
                        className="rounded-lg border border-bmq-border px-2 py-1.5 text-sm focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
                      >
                        {CONDITIONS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="hidden"
                        name="item_restock"
                        value={restocks[item.id] !== false ? "true" : "false"}
                      />
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={restocks[item.id] ?? true}
                          onChange={() => toggleRestock(item.id)}
                          className="rounded border-bmq-border text-bmq-mid-dark focus:ring-bmq-accent"
                        />
                        <span className="text-sm text-bmq-dark">Sim</span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-bmq-mid-dark">
            Quantidade devolvida não pode ser maior que a quantidade vendida.
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <SubmitButton
          loadingText="Registrando…"
          disabled={items.length === 0}
        >
          Registrar devolução
        </SubmitButton>
        {!inSlideOver && (
          <Link
            href="/dashboard/devolucoes"
            className="rounded-lg border border-bmq-border px-4 py-2 text-sm font-medium text-bmq-dark hover:bg-bmq-mid/20"
          >
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
