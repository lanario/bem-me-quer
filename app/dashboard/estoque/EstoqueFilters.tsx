"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { FiSearch } from "react-icons/fi";

interface EstoqueFiltersProps {
  buscaDefault: string;
  categoriaDefault: string;
  marcaDefault: string;
  statusDefault: string;
  validadeDefault: string;
  brands: { id: number; name: string }[];
  categories: { id: number; name: string }[];
  /** Base URL para redirecionamento ao filtrar (ex.: /dashboard/relatorios/estoque-atual) */
  basePath?: string;
}

export function EstoqueFilters({
  buscaDefault,
  categoriaDefault,
  marcaDefault,
  statusDefault,
  validadeDefault,
  brands,
  categories,
  basePath = "/dashboard/estoque",
}: EstoqueFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const params = new URLSearchParams();
    const busca = (formData.get("busca") as string)?.trim() || "";
    const categoria = (formData.get("categoria") as string) || "";
    const marca = (formData.get("marca") as string) || "";
    const status = (formData.get("status") as string) || "";
    const validade = (formData.get("validade") as string) || "";
    if (busca) params.set("busca", busca);
    if (categoria) params.set("categoria", categoria);
    if (marca) params.set("marca", marca);
    if (status) params.set("status", status);
    if (validade) params.set("validade", validade);
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Busca</span>
        <input
          type="search"
          name="busca"
          defaultValue={buscaDefault}
          placeholder="Nome, código, localização..."
          className="w-56 rounded-lg border border-bmq-border px-3 py-2 text-sm focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Categoria</span>
        <select
          name="categoria"
          defaultValue={categoriaDefault}
          className="rounded-lg border border-bmq-border px-3 py-2 text-sm focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
        >
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Marca</span>
        <select
          name="marca"
          defaultValue={marcaDefault}
          className="rounded-lg border border-bmq-border px-3 py-2 text-sm focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
        >
          <option value="">Todas</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Status estoque</span>
        <select
          name="status"
          defaultValue={statusDefault}
          className="rounded-lg border border-bmq-border px-3 py-2 text-sm focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
        >
          <option value="">Todos</option>
          <option value="ok">OK</option>
          <option value="low">Estoque baixo</option>
          <option value="out">Sem estoque</option>
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Validade</span>
        <select
          name="validade"
          defaultValue={validadeDefault}
          className="rounded-lg border border-bmq-border px-3 py-2 text-sm focus:border-bmq-accent focus:outline-none focus:ring-1 focus:ring-bmq-accent"
        >
          <option value="">Todos</option>
          <option value="vencido">Vencido</option>
          <option value="proximo">Próximo (30 dias)</option>
          <option value="valido">Válido</option>
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
