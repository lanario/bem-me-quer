"use client";

import { useRouter } from "next/navigation";

interface ProdutosFiltersProps {
  buscaDefault?: string;
  marcaDefault?: string;
  categoriaDefault?: string;
  tamanhoDefault?: string;
  brands?: { id: number; name: string }[];
  categories?: { id: number; name: string }[];
}

const SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"] as const;

export function ProdutosFilters({
  buscaDefault = "",
  marcaDefault = "",
  categoriaDefault = "",
  tamanhoDefault = "",
  brands = [],
  categories = [],
}: ProdutosFiltersProps) {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const params = new URLSearchParams();
    const busca = (form.elements.namedItem("busca") as HTMLInputElement).value;
    const marca = (form.elements.namedItem("marca") as HTMLSelectElement).value;
    const categoria = (form.elements.namedItem("categoria") as HTMLSelectElement).value;
    const tamanho = (form.elements.namedItem("tamanho") as HTMLSelectElement).value;
    if (busca) params.set("busca", busca);
    if (marca) params.set("marca", marca);
    if (categoria) params.set("categoria", categoria);
    if (tamanho) params.set("tamanho", tamanho);
    router.push(`/dashboard/produtos?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="min-w-[180px]">
        <span className="block text-sm font-medium text-gray-700 mb-1">Buscar</span>
        <input
          type="search"
          name="busca"
          defaultValue={buscaDefault}
          placeholder="Nome ou código de barras"
          className="w-full rounded-lg border border-bmq-border px-3 py-2 text-sm focus:ring-2 focus:ring-bmq-accent"
        />
      </label>
      <label>
        <span className="block text-sm font-medium text-gray-700 mb-1">Marca</span>
        <select
          name="marca"
          defaultValue={marcaDefault}
          className="rounded-lg border border-bmq-border px-3 py-2 text-sm focus:ring-2 focus:ring-bmq-accent min-w-[140px]"
        >
          <option value="">Todas</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="block text-sm font-medium text-gray-700 mb-1">Categoria</span>
        <select
          name="categoria"
          defaultValue={categoriaDefault}
          className="rounded-lg border border-bmq-border px-3 py-2 text-sm focus:ring-2 focus:ring-bmq-accent min-w-[140px]"
        >
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="block text-sm font-medium text-gray-700 mb-1">Tamanho</span>
        <select
          name="tamanho"
          defaultValue={tamanhoDefault}
          className="rounded-lg border border-bmq-border px-3 py-2 text-sm focus:ring-2 focus:ring-bmq-accent"
        >
          <option value="">Todos</option>
          {SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
      >
        Filtrar
      </button>
    </form>
  );
}
