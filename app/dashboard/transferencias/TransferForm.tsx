"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { useState, useCallback } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { createTransferAction, type TransferFormState } from "@/actions/transfers";
import { SubmitButton } from "@/components/ui/SubmitButton";

interface TransferFormProps {
  products: { id: number; title: string }[];
  locations: { id: number; name: string }[];
  inSlideOver?: boolean;
}

interface ItemRow {
  product_id: number;
  quantity: number;
}

export function TransferForm({ products, locations, inSlideOver }: TransferFormProps) {
  const [state, formAction] = useFormState(createTransferAction, {} as TransferFormState);
  const initialItem: ItemRow = {
    product_id: products[0]?.id ?? 0,
    quantity: 1,
  };
  const [items, setItems] = useState<ItemRow[]>([initialItem]);

  const addRow = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { product_id: products[0]?.id ?? 0, quantity: 1 },
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

  const hasLocations = locations.length > 0;

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="rounded-xl border border-bmq-border bg-white p-6 space-y-4">
        <h2 className="text-sm font-semibold text-bmq-dark">Origem e destino</h2>
        {hasLocations ? (
          <>
            <label className="block">
              <span className="text-sm font-medium text-bmq-mid-dark">Origem (localização) *</span>
              <select
                name="from_location"
                required
                className="mt-1 block w-full rounded-lg border border-bmq-border px-3 py-2 focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
              >
                <option value="">Selecione</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-bmq-mid-dark">Destino (localização) *</span>
              <select
                name="to_location"
                required
                className="mt-1 block w-full rounded-lg border border-bmq-border px-3 py-2 focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
              >
                <option value="">Selecione</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <>
            <label className="block">
              <span className="text-sm font-medium text-bmq-mid-dark">Origem (localização) *</span>
              <input
                type="text"
                name="from_location"
                required
                maxLength={100}
                placeholder="Ex: Prateleira A1"
                className="mt-1 block w-full rounded-lg border border-bmq-border px-3 py-2 focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
              />
              <p className="mt-1 text-xs text-bmq-mid-dark">
                Cadastre localizações em{" "}
                <a href="/dashboard/localizacoes" className="text-bmq-dark hover:underline">
                  Localizações
                </a>{" "}
                para usar dropdown.
              </p>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-bmq-mid-dark">Destino (localização) *</span>
              <input
                type="text"
                name="to_location"
                required
                maxLength={100}
                placeholder="Ex: Loja"
                className="mt-1 block w-full rounded-lg border border-bmq-border px-3 py-2 focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
              />
            </label>
          </>
        )}
      </div>

      <div className="rounded-xl border border-bmq-border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-bmq-dark">Itens</h2>
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-2 rounded-lg border border-bmq-border bg-white px-3 py-1.5 text-sm font-medium text-bmq-dark hover:bg-bmq-mid/20"
          >
            <FiPlus size={18} />
            Adicionar item
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-bmq-border">
            <thead className="bg-bmq-bg">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-bmq-mid-dark">
                  Produto *
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-bmq-mid-dark w-28">
                  Quantidade *
                </th>
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
                      onChange={(e) =>
                        updateRow(index, "product_id", Number(e.target.value))
                      }
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
                      required
                      min={1}
                      value={row.quantity}
                      onChange={(e) =>
                        updateRow(
                          index,
                          "quantity",
                          Math.max(1, Number(e.target.value) || 0)
                        )
                      }
                      className="w-full rounded-lg border border-bmq-border px-3 py-2 text-sm text-right focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="p-1.5 text-bmq-mid-dark hover:text-red-600 rounded"
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
      </div>

      <div className="rounded-xl border border-bmq-border bg-white p-6">
        <label className="block">
          <span className="text-sm font-medium text-bmq-mid-dark">Observações</span>
          <textarea
            name="notes"
            rows={2}
            className="mt-1 block w-full rounded-lg border border-bmq-border px-3 py-2 focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
          />
        </label>
      </div>

      <div className="flex gap-3">
        <SubmitButton loadingText="Criando…">
          Criar transferência
        </SubmitButton>
        {!inSlideOver && (
          <Link
            href="/dashboard/transferencias"
            className="rounded-lg border border-bmq-border px-4 py-2 text-sm font-medium text-bmq-dark hover:bg-bmq-mid/20"
          >
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
