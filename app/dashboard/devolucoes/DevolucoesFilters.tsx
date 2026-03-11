"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { FiSearch } from "react-icons/fi";
import type { ReturnStatus } from "@/types/database";

interface DevolucoesFiltersProps {
  statusDefault: string;
}

const STATUS_OPTIONS: { value: ReturnStatus; label: string }[] = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "APROVADA", label: "Aprovada" },
  { value: "REJEITADA", label: "Rejeitada" },
];

export function DevolucoesFilters({ statusDefault }: DevolucoesFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const params = new URLSearchParams();
    const status = (formData.get("status") as string) || "";
    if (status) params.set("status", status);
    startTransition(() => {
      router.push(`/dashboard/devolucoes?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 rounded-xl border border-bmq-border bg-bmq-bg p-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-bmq-dark">Status</span>
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
