"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiPackage, FiEdit2 } from "react-icons/fi";
import { AnimatedIcon } from "@/components/ui/AnimatedIcon";
import { MonthPicker } from "@/components/dashboard/MonthPicker";
import { ComprasFilters } from "./ComprasFilters";
import { ReceivePurchaseButton } from "./ReceivePurchaseButton";
import { CancelPurchaseButton } from "./CancelPurchaseButton";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { SlideOver } from "@/components/ui/SlideOver";
import { PurchaseForm } from "./PurchaseForm";
import type { PurchaseStatus, Tables } from "@/types/database";

const PAGE_SIZE = 20;

type PurchaseRow = Tables<"purchases">;
type PurchaseWithItems = Tables<"purchases"> & {
  purchase_items?: { product_id: number; quantity: number; unit_cost: number }[];
};

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

function statusBadge(status: PurchaseRow["status"]): { label: string; className: string } {
  switch (status) {
    case "PENDENTE":
      return { label: "Pendente", className: "bg-amber-100 text-amber-800" };
    case "RECEBIDA":
      return { label: "Recebida", className: "bg-green-100 text-green-800" };
    case "CANCELADA":
      return { label: "Cancelada", className: "bg-gray-100 text-gray-800" };
    default:
      return { label: String(status), className: "bg-gray-100 text-gray-800" };
  }
}

interface ComprasPageClientProps {
  list: PurchaseRow[];
  total: number;
  currentPage: number;
  yearMonth: string;
  status: string;
  fornecedor: string;
  data_inicio: string;
  data_fim: string;
  suppliers: string[];
  products: { id: number; title: string }[];
  purchaseToEdit: PurchaseWithItems | null;
  openNew: boolean;
  editId: string | null;
}

export function ComprasPageClient({
  list,
  total,
  currentPage,
  yearMonth,
  status,
  fornecedor,
  data_inicio,
  data_fim,
  suppliers,
  products,
  purchaseToEdit,
  openNew,
  editId,
}: ComprasPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOpen = openNew || Boolean(editId);

  function buildUrl(extra: { novo?: string; editar?: string }) {
    const p = new URLSearchParams(searchParams.toString());
    if (extra.novo != null) p.set("novo", extra.novo);
    if (extra.editar != null) p.set("editar", extra.editar);
    const q = p.toString();
    return q ? `/dashboard/compras?${q}` : "/dashboard/compras";
  }

  function closeSlideOver() {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("novo");
    p.delete("editar");
    const q = p.toString();
    router.push(q ? `/dashboard/compras?${q}` : "/dashboard/compras");
  }

  const preserveParams: Record<string, string> = {};
  if (status) preserveParams.status = status;
  if (fornecedor.trim()) preserveParams.fornecedor = fornecedor.trim();

  return (
    <>
      <div className="p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-bmq-dark">Compras</h1>
          <div className="flex flex-wrap items-center gap-3">
            <MonthPicker
              yearMonth={yearMonth}
              allowFutureMonths={true}
              preserveParams={Object.keys(preserveParams).length > 0 ? preserveParams : undefined}
            />
            <Link
              href={buildUrl({ novo: "1" })}
              className="group inline-flex items-center gap-2 rounded-lg bg-bmq-accent px-4 py-2 text-sm font-medium text-white hover:bg-bmq-mid"
            >
              <AnimatedIcon Icon={FiPackage} animation="box-jump" size={18} />
              Nova compra
            </Link>
          </div>
        </div>

        <ComprasFilters
          statusDefault={status}
          fornecedorDefault={fornecedor}
          dataInicioDefault={data_inicio}
          dataFimDefault={data_fim}
          suppliers={suppliers}
        />

        <div className="mt-4 overflow-x-auto rounded-lg border border-bmq-border bg-white">
          <table className="min-w-full divide-y divide-bmq-border">
            <thead className="bg-bmq-bg">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Fornecedor</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">NF</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-bmq-mid-dark">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-bmq-mid-dark">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bmq-border">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-bmq-mid-dark">
                    Nenhuma compra encontrada.
                  </td>
                </tr>
              ) : (
                list.map((p) => {
                  const badge = statusBadge(p.status);
                  return (
                    <tr key={p.id} className="hover:bg-bmq-mid/20">
                      <td className="px-4 py-3 text-sm font-medium text-bmq-dark">{p.id}</td>
                      <td className="px-4 py-3 text-sm text-bmq-dark">{p.supplier}</td>
                      <td className="px-4 py-3 text-sm text-bmq-mid-dark">{formatDate(p.purchase_date)}</td>
                      <td className="px-4 py-3 text-sm text-bmq-mid-dark">{p.invoice_number ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-right text-bmq-dark">
                        R$ {Number(p.total_value).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {p.status === "PENDENTE" && (
                            <>
                              <Link
                                href={buildUrl({ editar: String(p.id) })}
                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-bmq-dark hover:bg-bmq-mid/30"
                              >
                                <FiEdit2 size={16} />
                                Editar
                              </Link>
                              <ReceivePurchaseButton purchaseId={p.id} />
                              <CancelPurchaseButton purchaseId={p.id} />
                            </>
                          )}
                          {p.status === "RECEBIDA" && (
                            <CancelPurchaseButton purchaseId={p.id} received />
                          )}
                          {(p.status === "PENDENTE" || p.status === "RECEBIDA") && (
                            <Link
                              href={`/dashboard/compras/${p.id}`}
                              className="text-sm font-medium text-bmq-mid-dark hover:text-bmq-dark"
                            >
                              Ver
                            </Link>
                          )}
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
          basePath="/dashboard/compras"
        />
      </div>

      <SlideOver
        open={isOpen}
        onClose={closeSlideOver}
        title={editId ? "Editar compra" : "Nova compra"}
        contentWidth="wide"
        subtitle={
          editId
            ? "Altere os dados da compra (apenas compras pendentes)."
            : "Registre uma nova compra com itens."
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
        {products.length === 0 ? (
          <p className="text-bmq-mid-dark">
            Cadastre ao menos um produto antes de criar uma compra.
          </p>
        ) : (
          <PurchaseForm
            products={products}
            purchase={openNew ? undefined : purchaseToEdit ?? undefined}
            inSlideOver
          />
        )}
      </SlideOver>
    </>
  );
}
