"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiPlus, FiEdit2 } from "react-icons/fi";
import { DeleteBrandButton } from "./DeleteBrandButton";
import { SlideOver } from "@/components/ui/SlideOver";
import { BrandForm } from "./BrandForm";
import type { Tables } from "@/types/database";

interface MarcasPageClientProps {
  brands: Tables<"brands">[];
  brandToEdit: Tables<"brands"> | null;
  openNew: boolean;
  editId: string | null;
}

export function MarcasPageClient({
  brands,
  brandToEdit,
  openNew,
  editId,
}: MarcasPageClientProps) {
  const router = useRouter();
  const isOpen = openNew || Boolean(editId);

  function closeSlideOver() {
    router.push("/dashboard/marcas");
  }

  return (
    <>
      <div className="p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-bmq-dark">Marcas</h1>
          <Link
            href="/dashboard/marcas?novo=1"
            className="inline-flex items-center gap-2 rounded-lg bg-bmq-accent px-4 py-2 text-sm font-medium text-white hover:bg-bmq-mid"
          >
            <FiPlus size={18} />
            Nova marca
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
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-bmq-mid-dark">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bmq-border">
              {brands.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-bmq-mid-dark">
                    Nenhuma marca cadastrada.
                  </td>
                </tr>
              ) : (
                brands.map((b) => (
                  <tr key={b.id} className="hover:bg-bmq-mid/10">
                    <td className="px-4 py-3 text-sm font-medium text-bmq-dark">
                      {b.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-bmq-mid-dark max-w-[400px] truncate">
                      {b.description || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/marcas?editar=${b.id}`}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-bmq-dark hover:bg-bmq-mid/20"
                        >
                          <FiEdit2 size={16} />
                          Editar
                        </Link>
                        <DeleteBrandButton id={b.id} />
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
        title={editId ? "Editar marca" : "Nova marca"}
        subtitle={
          editId
            ? "Altere os dados da marca."
            : "Adicione uma nova marca de produto."
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
        <BrandForm
          brand={openNew ? undefined : brandToEdit ?? undefined}
          inSlideOver
        />
      </SlideOver>
    </>
  );
}
