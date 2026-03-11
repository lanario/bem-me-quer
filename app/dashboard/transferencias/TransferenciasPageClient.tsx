"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiRepeat } from "react-icons/fi";
import { AnimatedIcon } from "@/components/ui/AnimatedIcon";
import { TransferenciasFilters } from "./TransferenciasFilters";
import { ConfirmTransferButton } from "./ConfirmTransferButton";
import { CancelTransferButton } from "./CancelTransferButton";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { SlideOver } from "@/components/ui/SlideOver";
import { TransferForm } from "./TransferForm";
import type { TransferStatus, Tables } from "@/types/database";

const PAGE_SIZE = 20;

type TransferRow = Tables<"stock_transfers"> & {
  products?: { title: string } | null;
};

function formatDateTime(value: string): string {
  try {
    return new Date(value).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

function statusBadge(status: TransferRow["status"]): { label: string; className: string } {
  switch (status) {
    case "PENDENTE":
      return { label: "Pendente", className: "bg-amber-100 text-amber-800" };
    case "CONCLUIDA":
      return { label: "Concluída", className: "bg-green-100 text-green-800" };
    case "CANCELADA":
      return { label: "Cancelada", className: "bg-gray-100 text-gray-800" };
    default:
      return { label: String(status), className: "bg-gray-100 text-gray-800" };
  }
}

interface TransferenciasPageClientProps {
  list: TransferRow[];
  total: number;
  currentPage: number;
  status: string;
  data_inicio: string;
  data_fim: string;
  products: { id: number; title: string }[];
  locations: { id: number; name: string }[];
  openNew: boolean;
}

export function TransferenciasPageClient({
  list,
  total,
  currentPage,
  status,
  data_inicio,
  data_fim,
  products,
  locations,
  openNew,
}: TransferenciasPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOpen = openNew;

  function buildUrl(extra: { novo?: string }) {
    const p = new URLSearchParams(searchParams.toString());
    if (extra.novo != null) p.set("novo", extra.novo);
    const q = p.toString();
    return q ? `/dashboard/transferencias?${q}` : "/dashboard/transferencias";
  }

  function closeSlideOver() {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("novo");
    const q = p.toString();
    router.push(q ? `/dashboard/transferencias?${q}` : "/dashboard/transferencias");
  }

  return (
    <>
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-bmq-dark">Transferências</h1>
          <Link
            href={buildUrl({ novo: "1" })}
            className="group inline-flex items-center gap-2 rounded-lg bg-bmq-accent px-4 py-2 text-sm font-medium text-white hover:bg-bmq-mid"
          >
            <AnimatedIcon Icon={FiRepeat} animation="arrows-slide" size={18} />
            Nova transferência
          </Link>
        </div>

        <TransferenciasFilters
          statusDefault={status}
          dataInicioDefault={data_inicio}
          dataFimDefault={data_fim}
        />

        <div className="mt-4 overflow-x-auto rounded-lg border border-bmq-border bg-white">
          <table className="min-w-full divide-y divide-bmq-border">
            <thead className="bg-bmq-bg">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Origem</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Destino</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Produto</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-bmq-mid-dark">Qtd</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-bmq-mid-dark">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bmq-border">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-bmq-mid-dark">
                    Nenhuma transferência encontrada.
                  </td>
                </tr>
              ) : (
                list.map((t) => {
                  const badge = statusBadge(t.status);
                  return (
                    <tr key={t.id} className="hover:bg-bmq-mid/20">
                      <td className="px-4 py-3 text-sm font-medium text-bmq-dark">{t.id}</td>
                      <td className="px-4 py-3 text-sm text-bmq-dark">{t.from_location}</td>
                      <td className="px-4 py-3 text-sm text-bmq-dark">{t.to_location}</td>
                      <td className="px-4 py-3 text-sm text-bmq-dark">{t.products?.title ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-right text-bmq-dark">{t.quantity}</td>
                      <td className="px-4 py-3 text-sm text-bmq-mid-dark">{formatDateTime(t.transfer_date)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {t.status === "PENDENTE" && (
                            <>
                              <ConfirmTransferButton transferId={t.id} />
                              <CancelTransferButton transferId={t.id} />
                            </>
                          )}
                          {t.status === "CONCLUIDA" && (
                            <CancelTransferButton transferId={t.id} concluded />
                          )}
                          <Link
                            href={`/dashboard/transferencias/${t.id}`}
                            className="text-sm font-medium text-bmq-mid-dark hover:text-bmq-dark"
                          >
                            Ver
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <PaginationBar
          total={total}
          pageSize={PAGE_SIZE}
          currentPage={currentPage}
          basePath="/dashboard/transferencias"
        />
      </div>

      <SlideOver
        open={isOpen}
        onClose={closeSlideOver}
        title="Nova transferência"
        subtitle="Registre uma transferência de estoque entre localizações."
        contentWidth="wide"
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
        {products.length === 0 ? (
          <p className="text-bmq-mid-dark">
            Cadastre ao menos um produto antes de criar uma transferência.
          </p>
        ) : (
          <TransferForm products={products} locations={locations} inSlideOver />
        )}
      </SlideOver>
    </>
  );
}
