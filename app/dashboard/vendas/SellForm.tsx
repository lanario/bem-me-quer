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
import { SearchableSelect } from "@/components/ui/SearchableSelect";

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

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Percentual 0–100 a partir do texto do campo (aceita vírgula decimal). */
function parsePercentInput(value: string): number {
  const normalized = value.trim().replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(n, 0), 100);
}

type DiscountKind = "fixed" | "percent";

export function SellForm({ clients, products, sell, inSlideOver }: SellFormProps) {
  const isEdit = Boolean(sell?.id);
  const initialItems: ItemRow[] =
    sell?.sell_items?.length ?? 0
      ? (sell!.sell_items!.map((i) => ({
          product_id: i.product_id,
          quantity_input: String(i.quantity),
          unitary_price_input: formatMoneyInput(i.unitary_price ?? 0),
        })) as ItemRow[])
      : [
          {
            product_id: 0,
            quantity_input: "1",
            unitary_price_input: formatMoneyInput(0),
          },
        ];

  const [items, setItems] = useState<ItemRow[]>(initialItems);
  const [clientId, setClientId] = useState<number | "">(
    () => sell?.client_id ?? "",
  );
  const [discountKind, setDiscountKind] = useState<DiscountKind>("fixed");
  const [discountFixedInput, setDiscountFixedInput] = useState<string>(
    sell?.discount_value && sell.discount_value > 0
      ? formatMoneyInput(sell.discount_value)
      : "",
  );
  const [discountPercentInput, setDiscountPercentInput] = useState<string>("");

  const clientOptions = clients.map((c) => ({ id: c.id, label: c.name }));
  const productOptions = products.map((p) => ({ id: p.id, label: p.title }));

  const getDefaultPrice = useCallback(
    (productId: number) => products.find((p) => p.id === productId)?.defaultPrice ?? 0,
    [products]
  );

  const addRow = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        product_id: 0,
        quantity_input: "1",
        unitary_price_input: formatMoneyInput(0),
      },
    ]);
  }, []);

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
          const pid = value as number;
          next[index]!.unitary_price_input =
            pid > 0 ? formatMoneyInput(getDefaultPrice(pid)) : formatMoneyInput(0);
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
  const discountPercentNumeric = parsePercentInput(discountPercentInput);
  const discountFromPercent = roundMoney((totalBruto * discountPercentNumeric) / 100);
  const discountValue =
    discountKind === "percent"
      ? Math.min(Math.max(discountFromPercent, 0), totalBruto)
      : Math.min(Math.max(roundMoney(parseMoneyInput(discountFixedInput)), 0), totalBruto);
  const total = Math.max(0, totalBruto - discountValue);

  const discountSummaryExtra =
    discountKind === "percent" && discountPercentNumeric > 0 && discountValue > 0
      ? ` (${discountPercentNumeric.toLocaleString("pt-BR", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}%)`
      : "";

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
          <SearchableSelect
            name="client_id"
            options={clientOptions}
            value={clientId}
            onValueChange={setClientId}
            required
            placeholder="Buscar cliente…"
            className="mt-1"
          />
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
                  <td className="px-4 py-2 min-w-[12rem]">
                    <SearchableSelect
                      name="item_product_id"
                      options={productOptions}
                      value={row.product_id ? row.product_id : ""}
                      onValueChange={(v) =>
                        updateRow(index, "product_id", v === "" ? 0 : v)
                      }
                      required
                      placeholder="Buscar produto…"
                      inputClassName="min-w-[200px]"
                    />
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
        <div className="mt-4 flex flex-col items-end gap-3 sm:flex-row sm:items-center sm:justify-end">
          <span className="text-sm font-medium text-bmq-dark">Desconto</span>
          <input type="hidden" name="discount_kind" value={discountKind} />
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div
              className="inline-flex rounded-lg border border-bmq-border p-0.5"
              role="group"
              aria-label="Tipo de desconto"
            >
              <button
                type="button"
                onClick={() => setDiscountKind("fixed")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  discountKind === "fixed"
                    ? "bg-bmq-accent text-white"
                    : "text-bmq-mid-dark hover:bg-bmq-mid/15"
                }`}
              >
                R$
              </button>
              <button
                type="button"
                onClick={() => setDiscountKind("percent")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  discountKind === "percent"
                    ? "bg-bmq-accent text-white"
                    : "text-bmq-mid-dark hover:bg-bmq-mid/15"
                }`}
              >
                %
              </button>
            </div>
            {discountKind === "fixed" ? (
              <label className="flex items-center gap-2 text-sm text-bmq-dark">
                <span className="sr-only">Valor em reais</span>
                <input
                  type="text"
                  inputMode="decimal"
                  name="discount_fixed"
                  value={discountFixedInput}
                  placeholder="0,00"
                  onChange={(e) => setDiscountFixedInput(e.target.value)}
                  autoComplete="off"
                  className="w-28 rounded-lg border border-bmq-border px-3 py-2 text-sm text-right focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
                />
              </label>
            ) : (
              <label className="flex items-center gap-2 text-sm text-bmq-dark">
                <span className="sr-only">Percentual</span>
                <input
                  type="text"
                  inputMode="decimal"
                  name="discount_percent"
                  value={discountPercentInput}
                  placeholder="0"
                  onChange={(e) => setDiscountPercentInput(e.target.value)}
                  autoComplete="off"
                  className="w-24 rounded-lg border border-bmq-border px-3 py-2 text-sm text-right focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
                />
                <span className="text-bmq-mid-dark">%</span>
              </label>
            )}
          </div>
        </div>
        <p className="mt-2 text-right text-sm text-bmq-mid-dark">
          Subtotal: R$ {totalBruto.toFixed(2)}
          {discountValue > 0
            ? ` • Desconto: - R$ ${discountValue.toFixed(2)}${discountSummaryExtra}`
            : ""}
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
