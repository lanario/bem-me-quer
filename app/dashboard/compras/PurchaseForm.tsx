"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { useState, useCallback } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import {
  createPurchaseAction,
  updatePurchaseAction,
  type PurchaseFormState,
} from "@/actions/purchases";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { Tables } from "@/types/database";

type PurchaseWithItems = Tables<"purchases"> & {
  purchase_items?: { product_id: number; quantity: number; unit_cost: number }[];
};

interface PurchaseFormProps {
  products: { id: number; title: string }[];
  purchase?: PurchaseWithItems | null;
  inSlideOver?: boolean;
}

interface ItemRow {
  product_id: number;
  quantity: number;
  unit_cost: number;
}

function formatDate(value: string): string {
  try {
    const d = new Date(value);
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export function PurchaseForm({ products, purchase, inSlideOver }: PurchaseFormProps) {
  const isEdit = Boolean(purchase?.id);
  const initialItems: ItemRow[] =
    purchase?.purchase_items?.length ?? 0
      ? (purchase!.purchase_items!.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_cost: i.unit_cost,
        })) as ItemRow[])
      : [{ product_id: products[0]?.id ?? 0, quantity: 1, unit_cost: 0 }];

  const [items, setItems] = useState<ItemRow[]>(initialItems);

  const addRow = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { product_id: products[0]?.id ?? 0, quantity: 1, unit_cost: 0 },
    ]);
  }, [products]);

  const removeRow = useCallback((index: number) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }, []);

  const updateRow = useCallback(
    (index: number, field: keyof ItemRow, value: number) => {
      setItems((prev) =>
        prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
      );
    },
    []
  );

  const total = items.reduce((acc, row) => acc + row.quantity * row.unit_cost, 0);

  const formAction = isEdit
    ? (_prev: PurchaseFormState, formData: FormData) =>
        updatePurchaseAction(purchase!.id, _prev, formData)
    : createPurchaseAction;

  const [state, submitAction] = useFormState(formAction, {} as PurchaseFormState);

  return (
    <form action={submitAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cabeçalho</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Fornecedor *</span>
            <input
              type="text"
              name="supplier"
              required
              maxLength={100}
              defaultValue={purchase?.supplier ?? ""}
              className="mt-1 block w-full rounded-lg border border-bmq-border px-3 py-2 focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Nº NF</span>
            <input
              type="text"
              name="invoice_number"
              maxLength={50}
              defaultValue={purchase?.invoice_number ?? ""}
              className="mt-1 block w-full rounded-lg border border-bmq-border px-3 py-2 focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Data *</span>
            <input
              type="date"
              name="purchase_date"
              required
              defaultValue={formatDate(purchase?.purchase_date ?? "")}
              className="mt-1 block w-full rounded-lg border border-bmq-border px-3 py-2 focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
            />
          </label>
        </div>
        <label className="block mt-4">
          <span className="text-sm font-medium text-gray-700">Observações</span>
          <textarea
            name="notes"
            rows={2}
            defaultValue={purchase?.notes ?? ""}
            className="mt-1 block w-full rounded-lg border border-bmq-border px-3 py-2 focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
          />
        </label>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Itens</h2>
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-2 rounded-lg border border-bmq-border bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FiPlus size={18} />
            Adicionar item
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Produto</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Qtd</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Preço unit.</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Subtotal</th>
                <th className="px-4 py-2 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((row, index) => (
                <tr key={index}>
                  <td className="px-4 py-2">
                    <select
                      name="item_product_id"
                      required
                      value={row.product_id || ""}
                      onChange={(e) => updateRow(index, "product_id", Number(e.target.value))}
                      className="w-full rounded-lg border border-bmq-border px-3 py-2 text-sm focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
                    >
                      <option value="">Selecione</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      name="item_quantity"
                      min={1}
                      value={row.quantity}
                      onChange={(e) => updateRow(index, "quantity", Math.max(1, Number(e.target.value)))}
                      className="w-24 rounded-lg border border-bmq-border px-3 py-2 text-sm text-right focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      name="item_unit_cost"
                      min={0}
                      step="0.01"
                      value={row.unit_cost || ""}
                      onChange={(e) => updateRow(index, "unit_cost", parseFloat(String(e.target.value).replace(",", ".")) || 0)}
                      className="w-28 rounded-lg border border-bmq-border px-3 py-2 text-sm text-right focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
                    />
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-gray-900 font-medium">
                    R$ {(row.quantity * row.unit_cost).toFixed(2)}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                      title="Remover item"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-right text-lg font-semibold text-gray-900">
          Total: R$ {total.toFixed(2)}
        </p>
      </div>

      <div className="flex gap-3">
        <SubmitButton loadingText="Salvando…">
          {isEdit ? "Salvar alterações" : "Criar compra"}
        </SubmitButton>
        {!inSlideOver && (
          <Link
            href="/dashboard/compras"
            className="rounded-lg border border-bmq-border px-4 py-2 text-sm font-medium text-bmq-dark hover:bg-bmq-mid/20"
          >
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
