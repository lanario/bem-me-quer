"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function ClientesListSearch({
  defaultValue = "",
  orderDefault = "name",
}: {
  defaultValue?: string;
  orderDefault?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const busca = (form.elements.namedItem("busca") as HTMLInputElement).value;
    const ordem = (form.elements.namedItem("ordem") as HTMLSelectElement).value;
    const params = new URLSearchParams();
    if (busca) params.set("busca", busca);
    if (ordem && ordem !== "name") params.set("ordem", ordem);
    router.push(`/dashboard/clientes?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="flex-1 min-w-[200px]">
        <span className="block text-sm font-medium text-gray-700 mb-1">Buscar</span>
        <input
          type="search"
          name="busca"
          defaultValue={defaultValue}
          placeholder="Nome, e-mail ou telefone"
          className="w-full rounded-lg border border-bmq-border px-3 py-2 text-sm focus:ring-2 focus:ring-bmq-accent focus:border-bmq-accent"
        />
      </label>
      <label>
        <span className="block text-sm font-medium text-gray-700 mb-1">Ordenar</span>
        <select
          name="ordem"
          defaultValue={orderDefault}
          className="rounded-lg border border-bmq-border px-3 py-2 text-sm focus:ring-2 focus:ring-bmq-accent"
        >
          <option value="name">Nome</option>
          <option value="email">E-mail</option>
          <option value="created_at">Data</option>
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
