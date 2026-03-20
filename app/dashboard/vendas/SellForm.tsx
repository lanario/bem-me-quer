"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { useState, useCallback } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import {
  createSellAction,
  updateSellAction,
  type SellFormState,
} from "@/actions/sells";
import { SubmitButton } from "@/components/ui/SubmitButton";

/** Produto com preço padrão já resolvido (sell_price ?? category.price_default) */
export type ProductWithDefaultPrice = {
  id: number;
  title: string;
  defaultPrice: number;
};

interface SellFormProps {
  clients: { id: number; name: string }[];
  products: ProductWithDefaultPrice[];
  sell?: {
    id: number;
    client_id: number;
    discount_value?: number;
    sell_items?: { product_id: number; quantity: number; unitary_price: number | null }[];
  } | null;
  inSlideOver?: boolean;
}

interface ItemRow {
  product_id: number;
  quantity_input: string;
  unitary_price_input: string;
}

function parseQuantityInput(value: string): number {
  const onlyDigits = value.replace(/\D/g, "");
  const n = Number(onlyDigits);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function parseMoneyInput(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function formatMoneyInput(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

export function SellForm({ clients, products, sell, inSlideOver }: SellFormProps) {
  const isEdit = Boolean(sell?.id);
  const initialItems: ItemRow[] =
    sell?.sell_items?.length ?? 0
      ? (sell!.sell_items!.map((i) => ({
          product_id: i.product_id,
          quantity_input: String(i.quantity),
          unitary_price_input: formatMoneyInput(i.unitary_price ?? 0),
        })) as ItemRow[])
      : [{ product_id: products[0]?.id ?? 0, quantity_input: "1", unitary_price_input: formatMoneyInput(products[0]?.defaultPrice ?? 0) }];

  const [items, setItems] = useState<ItemRow[]>(initialItems);
  const [discountInput, setDiscountInput] = useState<string>(
    sell?.discount_value && sell.discount_value > 0 ? formatMoneyInput(sell.discount_value) : "",
  );

  const getDefaultPrice = useCallback(
    (productId: number) => products.find((p) => p.id === productId)?.defaultPrice ?? 0,
    [products]
  );

  const addRow = useCallback(() => {
    const firstId = products[0]?.id ?? 0;
    setItems((prev) => [
      ...prev,
      { product_id: firstId, quantity_input: "1", unitary_price_input: formatMoneyInput(getDefaultPrice(firstId)) },
    ]);
  }, [products, getDefaultPrice]);

  const removeRow = useCallback((index: number) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }, []);

  const updateRow = useCallback(
    (index: number, field: keyof ItemRow, value: number | string) => {
      setItems((prev) => {
        const next = prev.map((row, i) =>
          i === index ? { ...row, [field]: value as never } : row
        );
        if (field === "product_id") {
          next[index]!.unitary_price_input = formatMoneyInput(getDefaultPrice(value as number));
        }
        return next;
      });
    },
    [getDefaultPrice]
  );

  const totalBruto = items.reduce(
    (acc, row) => acc + parseQuantityInput(row.quantity_input) * parseMoneyInput(row.unitary_price_input),
    0,
  );
  const discountValueRaw = parseMoneyInput(discountInput);
  const discountValue = Math.min(Math.max(discountValueRaw, 0), totalBruto);
  const total = Math.max(0, totalBruto - discountValue);

  const formAction = isEdit
    ? (_prev: SellFormState, formData: FormData) =>
        updateSellAction(sell!.id, _prev, formData)
    : createSellAction;

  const [state, submitAction] = useFormState(formAction, {} as SellFormState);

  return (
    <form action={submitAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="rounded-xl border border-bmq-border bg-white p-6">
        <h2 className="text-lg font-semibold text-bmq-dark mb-4">Cliente</h2>
        <label className="block">
          <span className="text-sm font-medium text-bmq-dark">Cliente *</span>
          <select
            name="client_id"
            required
            defaultValue={sell?.client_id ?? ""}
            className="mt-1 block w-full rounded-lg border border-bmq-border px-3 py-2 focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
          >
            <option value="">Selecione o cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-bmq-border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-bmq-dark">Itens</h2>
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-2 rounded-lg border border-bmq-accent bg-bmq-accent/10 px-3 py-1.5 text-sm font-medium text-bmq-dark hover:bg-bmq-accent/20"
          >
            <FiPlus size={18} />
            Adicionar item
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-bmq-border">
            <thead className="bg-bmq-bg">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-bmq-mid-dark">Produto</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-bmq-mid-dark">Qtd</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-bmq-mid-dark">Preço unit.</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-bmq-mid-dark">Subtotal</th>
                <th className="px-4 py-2 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-bmq-border">
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
                      type="text"
                      inputMode="numeric"
                      name="item_quantity"
                      value={row.quantity_input}
                      onChange={(e) => updateRow(index, "quantity_input", e.target.value)}
                      className="w-24 rounded-lg border border-bmq-border px-3 py-2 text-sm text-right focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      name="item_unitary_price"
                      value={row.unitary_price_input}
                      onChange={(e) => updateRow(index, "unitary_price_input", e.target.value)}
                      className="w-28 rounded-lg border border-bmq-border px-3 py-2 text-sm text-right focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
                    />
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-bmq-dark font-medium">
                    R$ {(parseQuantityInput(row.quantity_input) * parseMoneyInput(row.unitary_price_input)).toFixed(2)}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="rounded border border-bmq-accent/40 bg-bmq-accent/10 p-1.5 text-bmq-dark hover:bg-bmq-accent/20"
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
        <div className="mt-4 flex justify-end">
          <label className="flex items-center gap-2 text-sm text-bmq-dark">
            Desconto (R$):
            <input
              type="text"
              inputMode="decimal"
              name="discount_value"
              value={discountInput}
              placeholder="0,00"
              onChange={(e) => setDiscountInput(e.target.value)}
              className="w-28 rounded-lg border border-bmq-border px-3 py-2 text-sm text-right focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
            />
          </label>
        </div>
        <p className="mt-2 text-right text-sm text-bmq-mid-dark">
          Subtotal: R$ {totalBruto.toFixed(2)} {discountValue > 0 ? `• Desconto: - R$ ${discountValue.toFixed(2)}` : ""}
        </p>
        <p className="mt-4 text-right text-lg font-semibold text-bmq-dark">
          Total: R$ {total.toFixed(2)}
        </p>
      </div>

      <div className="flex gap-3">
        <SubmitButton loadingText="Salvando…">
          {isEdit ? "Salvar alterações" : "Criar venda"}
        </SubmitButton>
        {!inSlideOver && (
          <Link
            href="/dashboard/vendas"
            className="rounded-lg border border-bmq-accent bg-bmq-accent/10 px-4 py-2 text-sm font-medium text-bmq-dark hover:bg-bmq-accent/20"
          >
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
