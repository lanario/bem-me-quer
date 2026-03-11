"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiEdit2 } from "react-icons/fi";
import { DevolucoesFilters } from "./DevolucoesFilters";
import { ApproveReturnButton } from "./ApproveReturnButton";
import { RejectReturnButton } from "./RejectReturnButton";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { SlideOver } from "@/components/ui/SlideOver";
import { ReturnForm } from "./ReturnForm";
import type { ReturnStatus, Tables } from "@/types/database";

const PAGE_SIZE = 20;

type ReturnRow = Tables<"returns"> & {
  sells?: { id: number; data: string; clients?: { name: string } | null } | null;
};

const REASON_LABEL: Record<ReturnRow["reason"], string> = {
  DEFEITO: "Defeito",
  TROCA: "Troca",
  DESISTENCIA: "Desistência",
  OUTRO: "Outro",
};

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function statusBadge(status: ReturnRow["status"]): { label: string; className: string } {
  switch (status) {
    case "PENDENTE":
      return { label: "Pendente", className: "bg-amber-100 text-amber-800" };
    case "APROVADA":
      return { label: "Aprovada", className: "bg-green-100 text-green-800" };
    case "REJEITADA":
      return { label: "Rejeitada", className: "bg-gray-100 text-gray-800" };
    default:
      return { label: String(status), className: "bg-gray-100 text-gray-800" };
  }
}

interface DevolucoesPageClientProps {
  list: ReturnRow[];
  total: number;
  currentPage: number;
  status: string;
  sells: { id: number; label: string }[];
  openNew: boolean;
}

export function DevolucoesPageClient({
  list,
  total,
  currentPage,
  status,
  sells,
  openNew,
}: DevolucoesPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOpen = openNew;

  function buildUrl(extra: { novo?: string }) {
    const p = new URLSearchParams(searchParams.toString());
    if (extra.novo != null) p.set("novo", extra.novo);
    const q = p.toString();
    return q ? `/dashboard/devolucoes?${q}` : "/dashboard/devolucoes";
  }

  function closeSlideOver() {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("novo");
    const q = p.toString();
    router.push(q ? `/dashboard/devolucoes?${q}` : "/dashboard/devolucoes");
  }

  return (
    <>
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-bmq-dark">Devoluções</h1>
          <Link
            href={buildUrl({ novo: "1" })}
            className="inline-flex items-center gap-2 rounded-lg bg-bmq-accent px-4 py-2 text-sm font-medium text-white hover:bg-bmq-mid"
          >
            <FiEdit2 size={18} />
            Nova devolução
          </Link>
        </div>

        <DevolucoesFilters statusDefault={status} />

        <div className="mt-4 overflow-x-auto rounded-lg border border-bmq-border bg-white">
          <table className="min-w-full divide-y divide-bmq-border">
            <thead className="bg-bmq-bg">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Venda</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Motivo</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-bmq-mid-dark">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bmq-border">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-bmq-mid-dark">
                    Nenhuma devolução encontrada.
                  </td>
                </tr>
              ) : (
                list.map((r) => {
                  const badge = statusBadge(r.status);
                  const sell = r.sells as { id: number; data: string; clients?: { name: string } | null } | undefined;
                  return (
                    <tr key={r.id} className="hover:bg-bmq-mid/10">
                      <td className="px-4 py-3 text-sm font-medium text-bmq-dark">{r.id}</td>
                      <td className="px-4 py-3 text-sm text-bmq-dark">
                        #{sell?.id ?? "—"} {sell?.clients?.name ? ` · ${sell.clients.name}` : ""}
                      </td>
                      <td className="px-4 py-3 text-sm text-bmq-mid-dark">{formatDate(r.return_date)}</td>
                      <td className="px-4 py-3 text-sm text-bmq-mid-dark">{REASON_LABEL[r.reason]}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {r.status === "PENDENTE" && (
                            <>
                              <ApproveReturnButton returnId={r.id} />
                              <RejectReturnButton returnId={r.id} />
                            </>
                          )}
                          {r.status === "APROVADA" && <RejectReturnButton returnId={r.id} wasApproved />}
                          <Link
                            href={`/dashboard/devolucoes/${r.id}`}
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
          basePath="/dashboard/devolucoes"
        />
      </div>

      <SlideOver
        open={isOpen}
        onClose={closeSlideOver}
        title="Nova devolução"
        subtitle="Registre uma devolução vinculada a uma venda concluída."
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
        {sells.length === 0 ? (
          <p className="text-bmq-mid-dark">
            Não há vendas concluídas. Conclua uma venda antes de registrar uma devolução.
          </p>
        ) : (
          <ReturnForm sells={sells} inSlideOver />
        )}
      </SlideOver>
    </>
  );
}
