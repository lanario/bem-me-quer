import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FiArrowLeft } from "react-icons/fi";
import { ConfirmSellButton } from "../ConfirmSellButton";
import { CancelSellButton } from "../CancelSellButton";
import { RemoveSellItemButton } from "../RemoveSellItemButton";
import type { Tables } from "@/types/database";

type SellRow = Tables<"sells"> & { clients?: { name: string } | null };
type SellItemRow = Tables<"sell_items"> & { products?: { title: string } | null };

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

export default async function VendaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: sellData, error } = await supabase
    .from("sells")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (error || !sellData) {
    notFound();
  }

  const sell = sellData as SellRow & { clients?: { name: string } | null };
  const { data: itemsData } = await supabase
    .from("sell_items")
    .select("*, products(title)")
    .eq("sell_id", sell.id);
  const items = (itemsData ?? []) as SellItemRow[];
  const badge = statusBadge(sell.status);

  return (
    <div className="p-8">
      <Link
        href="/dashboard/vendas"
        className="inline-flex items-center gap-2 text-sm text-bmq-mid-dark hover:text-bmq-dark mb-6"
      >
        <FiArrowLeft size={18} />
        Voltar
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-bmq-dark">Venda #{sell.id}</h1>
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      <div className="rounded-xl border border-bmq-border bg-white p-6 mb-6">
        <h2 className="text-lg font-semibold text-bmq-dark mb-4">Dados da venda</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-bmq-mid-dark">Cliente</dt>
            <dd className="font-medium text-bmq-dark">{sell.clients?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-bmq-mid-dark">Data</dt>
            <dd className="font-medium text-bmq-dark">{formatDateTime(sell.data)}</dd>
          </div>
          <div>
            <dt className="text-bmq-mid-dark">Total</dt>
            <dd className="font-medium text-bmq-dark">R$ {Number(sell.total_value).toFixed(2)}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-bmq-border bg-white p-6 mb-6">
        <h2 className="text-lg font-semibold text-bmq-dark mb-4">Itens</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-bmq-border">
            <thead className="bg-bmq-bg">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-bmq-mid-dark">Produto</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-bmq-mid-dark">Qtd</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-bmq-mid-dark">Preço unit.</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-bmq-mid-dark">Subtotal</th>
                {sell.status !== "CANCELADA" && <th className="px-4 py-2 w-16" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-bmq-border">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2 text-sm text-bmq-dark">{item.products?.title ?? "—"}</td>
                  <td className="px-4 py-2 text-sm text-right text-bmq-dark">{item.quantity}</td>
                  <td className="px-4 py-2 text-sm text-right text-bmq-dark">
                    R$ {Number(item.unitary_price ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-bmq-dark font-medium">
                    R$ {Number(item.subtotal).toFixed(2)}
                  </td>
                  {sell.status !== "CANCELADA" && (
                    <td className="px-4 py-2">
                      <RemoveSellItemButton sellId={sell.id} sellItemId={item.id} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {sell.status === "PENDENTE" && (
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dashboard/vendas/${sell.id}/editar`}
            className="inline-flex items-center gap-2 rounded-lg bg-bmq-accent px-4 py-2 text-sm font-medium text-white hover:bg-bmq-mid"
          >
            Editar venda
          </Link>
          <ConfirmSellButton sellId={sell.id} />
          <CancelSellButton sellId={sell.id} />
        </div>
      )}
      {sell.status === "CONCLUIDA" && (
        <CancelSellButton sellId={sell.id} received />
      )}
    </div>
  );
}
