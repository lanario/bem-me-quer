"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, useOptimistic } from "react";
import { FiPlus, FiEdit2 } from "react-icons/fi";
import { deleteCategoryAction } from "@/actions/categories";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { SlideOver } from "@/components/ui/SlideOver";
import { CategoryForm } from "./CategoryForm";
import type { Tables } from "@/types/database";

interface CategoriasPageClientProps {
  categories: Tables<"categories">[];
  categoryToEdit: Tables<"categories"> | null;
  openNew: boolean;
  editId: string | null;
}

export function CategoriasPageClient({
  categories,
  categoryToEdit,
  openNew,
  editId,
}: CategoriasPageClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimisticCategories, setOptimisticCategories] = useOptimistic(
    categories,
    (state, id: number) => state.filter((c) => c.id !== id)
  );
  const isOpen = openNew || Boolean(editId);

  function closeSlideOver() {
    router.push("/dashboard/categorias");
  }

  function handleDeleteCategory(id: number) {
    startTransition(async () => {
      // Sem bloqueios: atualização otimista antes do await elimina a latência percebida no clique.
      setOptimisticCategories(id);
      await deleteCategoryAction(id);
      router.refresh();
      // Fallback seguro: se deleteCategoryAction falhar, useOptimistic reverte e o item volta à lista.
    });
  }

  return (
    <>
      <div className="p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-bmq-dark">Categorias</h1>
          <Link
            href="/dashboard/categorias?novo=1"
            className="inline-flex items-center gap-2 rounded-lg bg-bmq-accent px-4 py-2 text-sm font-medium text-white hover:bg-bmq-mid"
          >
            <FiPlus size={18} />
            Nova categoria
          </Link>
        </div>

        <div className="overflow-x-auto rounded-lg border border-bmq-border bg-white">
          <table className="min-w-full divide-y divide-bmq-border">
            <thead className="bg-bmq-bg">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">
                  Descrição
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">
                  Preço padrão
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-bmq-mid-dark">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bmq-border">
              {optimisticCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-bmq-mid-dark">
                    Nenhuma categoria cadastrada.
                  </td>
                </tr>
              ) : (
                optimisticCategories.map((c) => (
                  <tr key={c.id} className="transition-all duration-200 hover:bg-bmq-mid/10">
                    <td className="px-4 py-3 text-sm font-medium text-bmq-dark">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-bmq-mid-dark max-w-[300px] truncate">
                      {c.description || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-bmq-mid-dark">
                      {c.price_default != null
                        ? `R$ ${Number(c.price_default).toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/categorias?editar=${c.id}`}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-bmq-dark hover:bg-bmq-mid/20"
                        >
                          <FiEdit2 size={16} />
                          Editar
                        </Link>
                        <DeleteButton
                          action={() => handleDeleteCategory(c.id)}
                          label="Excluir"
                          confirmMessage="Tem certeza que deseja excluir esta categoria?"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SlideOver
        open={isOpen}
        onClose={closeSlideOver}
        title={editId ? "Editar categoria" : "Nova categoria"}
        subtitle={
          editId
            ? "Altere os dados da categoria."
            : "Adicione uma nova categoria de produto."
        }
        footer={
          <button
            type="button"
            onClick={closeSlideOver}
            className="rounded-lg border border-bmq-border px-4 py-2 text-sm font-medium text-bmq-dark hover:bg-bmq-mid/20"
          >
            Cancelar
          </button>
        }
      >
        <CategoryForm
          category={openNew ? undefined : categoryToEdit ?? undefined}
          inSlideOver
        />
      </SlideOver>
    </>
  );
}
