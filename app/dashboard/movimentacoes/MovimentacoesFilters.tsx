"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { FiSearch } from "react-icons/fi";
import type { MovementType, MovementReason } from "@/types/database";

interface MovimentacoesFiltersProps {
  tipoDefault: string;
  motivoDefault: string;
  produtoDefault: string;
  dataInicioDefault: string;
  dataFimDefault: string;
  productOptions: { id: number; title: string }[];
  basePath?: string;
}

const TIPOS: { value: MovementType; label: string }[] = [
  { value: "ENTRADA", label: "Entrada" },
  { value: "SAIDA", label: "Saída" },
  { value: "AJUSTE", label: "Ajuste" },
  { value: "DEVOLUCAO", label: "Devolução" },
];
const MOTIVOS: { value: MovementReason; label: string }[] = [
  { value: "COMPRA", label: "Compra" },
  { value: "VENDA", label: "Venda" },
  { value: "AJUSTE", label: "Ajuste" },
  { value: "PERDA", label: "Perda" },
  { value: "DEVOLUCAO_CLIENTE", label: "Devolução cliente" },
];

export function MovimentacoesFilters({
  tipoDefault,
  motivoDefault,
  produtoDefault,
  dataInicioDefault,
  dataFimDefault,
  productOptions,
  basePath = "/dashboard/movimentacoes",
}: MovimentacoesFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const params = new URLSearchParams();
    const tipo = (formData.get("tipo") as string) || "";
    const motivo = (formData.get("motivo") as string) || "";
    const produto = (formData.get("produto") as string) || "";
    const dataInicio = (formData.get("data_inicio") as string) || "";
    const dataFim = (formData.get("data_fim") as string) || "";
    if (tipo) params.set("tipo", tipo);
    if (motivo) params.set("motivo", motivo);
    if (produto) params.set("produto", produto);
    if (dataInicio) params.set("data_inicio", dataInicio);
    if (dataFim) params.set("data_fim", dataFim);
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 rounded-xl border border-bmq-border bg-bmq-bg p-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-bmq-dark">Tipo</span>
        <select
          name="tipo"
          defaultValue={tipoDefault}
          className="rounded-lg border border-bmq-border px-3 py-2 text-sm focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
        >
          <option value="">Todos</option>
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-bmq-dark">Motivo</span>
        <select
          name="motivo"
          defaultValue={motivoDefault}
          className="rounded-lg border border-bmq-border px-3 py-2 text-sm focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
        >
          <option value="">Todos</option>
          {MOTIVOS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-bmq-dark">Produto</span>
        <select
          name="produto"
          defaultValue={produtoDefault}
          className="min-w-[180px] rounded-lg border border-bmq-border px-3 py-2 text-sm focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
        >
          <option value="">Todos</option>
          {productOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-bmq-dark">Data início</span>
        <input
          type="date"
          name="data_inicio"
          defaultValue={dataInicioDefault}
          className="rounded-lg border border-bmq-border px-3 py-2 text-sm focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-bmq-dark">Data fim</span>
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
