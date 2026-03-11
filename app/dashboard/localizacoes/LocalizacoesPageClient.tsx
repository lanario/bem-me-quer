"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiPlus, FiEdit2 } from "react-icons/fi";
import { DeleteLocationButton } from "./DeleteLocationButton";
import { SlideOver } from "@/components/ui/SlideOver";
import { LocationForm } from "./LocationForm";
import type { Tables } from "@/types/database";
import type { ProductInLocation } from "./page";

interface LocalizacoesPageClientProps {
  locations: Tables<"locations">[];
  productsByLocation: Record<number, ProductInLocation[]>;
  locationToEdit: Tables<"locations"> | null;
  openNew: boolean;
  editId: string | null;
}

const MAX_PRODUCTS_PREVIEW = 5;

export function LocalizacoesPageClient({
  locations,
  productsByLocation,
  locationToEdit,
  openNew,
  editId,
}: LocalizacoesPageClientProps) {
  const router = useRouter();
  const isOpen = openNew || Boolean(editId);

  function closeSlideOver() {
    router.push("/dashboard/localizacoes");
  }

  function renderProducts(locId: number) {
    const products = productsByLocation[locId] ?? [];
    if (products.length === 0) {
      return <span className="text-gray-400">Nenhum produto</span>;
    }
    const preview = products.slice(0, MAX_PRODUCTS_PREVIEW);
    const rest = products.length - MAX_PRODUCTS_PREVIEW;
    return (
      <div className="text-sm text-bmq-mid-dark">
        <ul className="list-disc list-inside space-y-0.5">
          {preview.map((p, i) => (
            <li key={i}>
              {p.title} <span className="text-bmq-dark font-medium">({p.quantity})</span>
            </li>
          ))}
        </ul>
        {rest > 0 && (
          <p className="mt-1 text-xs text-gray-500">e mais {rest} produto(s)</p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-bmq-dark">Localizações</h1>
          <Link
            href="/dashboard/localizacoes?novo=1"
            className="inline-flex items-center gap-2 rounded-lg bg-bmq-accent px-4 py-2 text-sm font-medium text-white hover:bg-bmq-mid"
          >
            <FiPlus size={18} />
            Nova localização
          </Link>
        </div>
        <p className="text-bmq-mid-dark mb-6">
          Cadastre os locais de estoque (ex: Prateleira A1, Loja) para usar em transferências e no cadastro de produtos.
        </p>

        <div className="overflow-x-auto rounded-card border border-bmq-border bg-white shadow-card">
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
                  Produtos no estoque
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-bmq-mid-dark">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bmq-border">
              {locations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-bmq-mid-dark">
                    Nenhuma localização cadastrada.
                  </td>
                </tr>
              ) : (
                locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-bmq-mid/10">
                    <td className="px-4 py-3 text-sm font-medium text-bmq-dark">
                      {loc.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-bmq-mid-dark max-w-[280px] truncate">
                      {loc.description || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm max-w-[320px] align-top">
                      {renderProducts(loc.id)}
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/localizacoes?editar=${loc.id}`}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-bmq-dark hover:bg-bmq-mid/20"
                        >
                          <FiEdit2 size={16} />
                          Editar
                        </Link>
                        <DeleteLocationButton id={loc.id} />
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
        title={editId ? "Editar localização" : "Nova localização"}
        subtitle={
          editId
            ? "Altere os dados da localização."
            : "Adicione um novo local de estoque."
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
        <LocationForm
          location={openNew ? undefined : locationToEdit ?? undefined}
          inSlideOver
        />
      </SlideOver>
    </>
  );
}
