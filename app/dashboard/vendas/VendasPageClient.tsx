"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiShoppingCart, FiEdit2 } from "react-icons/fi";
import { AnimatedIcon } from "@/components/ui/AnimatedIcon";
import { MonthPicker } from "@/components/dashboard/MonthPicker";
import { VendasFilters } from "./VendasFilters";
import { ConfirmSellButton } from "./ConfirmSellButton";
import { CancelSellButton } from "./CancelSellButton";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { SlideOver } from "@/components/ui/SlideOver";
import { SellForm, type ProductWithDefaultPrice } from "./SellForm";
import type { Tables } from "@/types/database";

const PAGE_SIZE = 20;

type SellRow = Tables<"sells"> & {
  clients?: { name: string } | null;
};
type SellWithItems = Tables<"sells"> & {
  sell_items?: { product_id: number; quantity: number; unitary_price: number | null }[];
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

function statusBadge(status: SellRow["status"]): { label: string; className: string } {
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

interface VendasPageClientProps {
  list: SellRow[];
  total: number;
  currentPage: number;
  yearMonth: string;
  status: string;
  data_inicio: string;
  data_fim: string;
  clients: { id: number; name: string }[];
  products: ProductWithDefaultPrice[];
  sellToEdit: SellWithItems | null;
  openNew: boolean;
  editId: string | null;
}

export function VendasPageClient({
  list,
  total,
  currentPage,
  yearMonth,
  status,
  data_inicio,
  data_fim,
  clients,
  products,
  sellToEdit,
  openNew,
  editId,
}: VendasPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOpen = openNew || Boolean(editId);

  function buildUrl(extra: { novo?: string; editar?: string }) {
    const p = new URLSearchParams(searchParams.toString());
    if (extra.novo != null) p.set("novo", extra.novo);
    if (extra.editar != null) p.set("editar", extra.editar);
    const q = p.toString();
    return q ? `/dashboard/vendas?${q}` : "/dashboard/vendas";
  }

  function closeSlideOver() {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("novo");
    p.delete("editar");
    const q = p.toString();
    router.push(q ? `/dashboard/vendas?${q}` : "/dashboard/vendas");
  }

  return (
    <>
      <div className="p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-bmq-dark">Vendas</h1>
          <div className="flex flex-wrap items-center gap-3">
            <MonthPicker
              yearMonth={yearMonth}
              allowFutureMonths={true}
              preserveParams={status ? { status } : undefined}
            />
            <Link
              href={buildUrl({ novo: "1" })}
              className="group inline-flex items-center gap-2 rounded-lg bg-bmq-accent px-4 py-2 text-sm font-medium text-white hover:bg-bmq-mid"
            >
              <AnimatedIcon Icon={FiShoppingCart} animation="cart-slide" size={18} />
              Nova venda
            </Link>
          </div>
        </div>

        <VendasFilters
          statusDefault={status}
          dataInicioDefault={data_inicio}
          dataFimDefault={data_fim}
        />

        <div className="mt-4 overflow-x-auto rounded-lg border border-bmq-border bg-white">
          <table className="min-w-full divide-y divide-bmq-border">
            <thead className="bg-bmq-bg">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Data</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-bmq-mid-dark">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-bmq-mid-dark">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bmq-border">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-bmq-mid-dark">
                    Nenhuma venda encontrada.
                  </td>
                </tr>
              ) : (
                list.map((s) => {
                  const badge = statusBadge(s.status);
                  return (
                    <tr key={s.id} className="hover:bg-bmq-mid/20">
                      <td className="px-4 py-3 text-sm font-medium text-bmq-dark">{s.id}</td>
                      <td className="px-4 py-3 text-sm text-bmq-dark">{s.clients?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-bmq-mid-dark">{formatDateTime(s.data)}</td>
                      <td className="px-4 py-3 text-sm text-right text-bmq-dark">
                        R$ {Number(s.total_value).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {s.status === "PENDENTE" && (
                            <>
                              <Link
                                href={buildUrl({ editar: String(s.id) })}
                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-bmq-dark hover:bg-bmq-mid/30"
                              >
                                <FiEdit2 size={16} />
                                Editar
                              </Link>
                              <ConfirmSellButton sellId={s.id} />
                              <CancelSellButton sellId={s.id} />
                            </>
                          )}
                          {s.status === "CONCLUIDA" && (
                            <CancelSellButton sellId={s.id} received />
                          )}
                          <Link
                            href={`/dashboard/vendas/${s.id}`}
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
          basePath="/dashboard/vendas"
        />
      </div>

      <SlideOver
        open={isOpen}
        onClose={closeSlideOver}
        title={editId ? "Editar venda" : "Nova venda"}
        subtitle={
          editId
            ? "Altere os dados da venda (apenas vendas pendentes)."
            : "Registre uma nova venda com itens."
        }
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
        {clients.length === 0 ? (
          <p className="text-bmq-mid-dark">Cadastre ao menos um cliente antes de criar uma venda.</p>
        ) : products.length === 0 ? (
          <p className="text-bmq-mid-dark">Cadastre ao menos um produto antes de criar uma venda.</p>
        ) : (
          <SellForm
            clients={clients}
            products={products}
            sell={openNew ? undefined : sellToEdit ?? undefined}
            inSlideOver
          />
        )}
      </SlideOver>
    </>
  );
}
