"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { FiSearch } from "react-icons/fi";
import type { PurchaseStatus } from "@/types/database";

interface ComprasFiltersProps {
  statusDefault: string;
  fornecedorDefault: string;
  dataInicioDefault: string;
  dataFimDefault: string;
  suppliers: string[];
}

const STATUS_OPTIONS: { value: PurchaseStatus; label: string }[] = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "RECEBIDA", label: "Recebida" },
  { value: "CANCELADA", label: "Cancelada" },
];

export function ComprasFilters({
  statusDefault,
  fornecedorDefault,
  dataInicioDefault,
  dataFimDefault,
  suppliers,
}: ComprasFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const params = new URLSearchParams();
    const status = (formData.get("status") as string) || "";
    const fornecedor = (formData.get("fornecedor") as string)?.trim() || "";
    const dataInicio = (formData.get("data_inicio") as string) || "";
    const dataFim = (formData.get("data_fim") as string) || "";
    if (status) params.set("status", status);
    if (fornecedor) params.set("fornecedor", fornecedor);
    if (dataInicio) params.set("data_inicio", dataInicio);
    if (dataFim) params.set("data_fim", dataFim);
    startTransition(() => {
      router.push(`/dashboard/compras?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Status</span>
        <select
          name="status"
          defaultValue={statusDefault}
          className="rounded-lg border border-bmq-border px-3 py-2 text-sm focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
        >
          <option value="">Todos</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Fornecedor</span>
        <input
          type="text"
          name="fornecedor"
          defaultValue={fornecedorDefault}
          list="suppliers-list"
          placeholder="Buscar por nome..."
          className="min-w-[180px] rounded-lg border border-bmq-border px-3 py-2 text-sm focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
        />
        <datalist id="suppliers-list">
          {suppliers.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Data início</span>
        <input
          type="date"
          name="data_inicio"
          defaultValue={dataInicioDefault}
          className="rounded-lg border border-bmq-border px-3 py-2 text-sm focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Data fim</span>
        <input
          type="date"
          name="data_fim"
          defaultValue={dataFimDefault}
          className="rounded-lg border border-bmq-border px-3 py-2 text-sm focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-bmq-accent px-4 py-2 text-sm font-medium text-white hover:bg-bmq-mid disabled:opacity-50"
      >
        <FiSearch size={18} />
        Filtrar
      </button>
    </form>
  );
}
