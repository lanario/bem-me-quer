"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { FiSearch } from "react-icons/fi";
import type { TransferStatus } from "@/types/database";

interface TransferenciasFiltersProps {
  statusDefault: string;
  dataInicioDefault: string;
  dataFimDefault: string;
}

const STATUS_OPTIONS: { value: TransferStatus; label: string }[] = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "CONCLUIDA", label: "Concluída" },
  { value: "CANCELADA", label: "Cancelada" },
];

export function TransferenciasFilters({
  statusDefault,
  dataInicioDefault,
  dataFimDefault,
}: TransferenciasFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const params = new URLSearchParams();
    const status = (formData.get("status") as string) || "";
    const dataInicio = (formData.get("data_inicio") as string) || "";
    const dataFim = (formData.get("data_fim") as string) || "";
    if (status) params.set("status", status);
    if (dataInicio) params.set("data_inicio", dataInicio);
    if (dataFim) params.set("data_fim", dataFim);
    startTransition(() => {
      router.push(`/dashboard/transferencias?${params.toString()}`);
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
