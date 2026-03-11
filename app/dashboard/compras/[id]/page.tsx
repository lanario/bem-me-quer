import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FiArrowLeft } from "react-icons/fi";
import { ReceivePurchaseButton } from "../ReceivePurchaseButton";
import { CancelPurchaseButton } from "../CancelPurchaseButton";
import type { Tables } from "@/types/database";

type PurchaseRow = Tables<"purchases">;
type PurchaseItemRow = Tables<"purchase_items"> & {
  products?: { title: string } | null;
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

export default async function CompraDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: purchaseData, error } = await supabase
    .from("purchases")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (error || !purchaseData) {
    notFound();
  }

  const purchase = purchaseData as PurchaseRow;
  const { data: itemsData } = await supabase
    .from("purchase_items")
    .select("*, products(title)")
    .eq("purchase_id", purchase.id);
  const items = (itemsData ?? []) as PurchaseItemRow[];
  const badge = statusBadge(purchase.status);

  return (
    <div className="p-8">
      <Link
        href="/dashboard/compras"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <FiArrowLeft size={18} />
        Voltar
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Compra #{purchase.id}</h1>
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cabeçalho</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500">Fornecedor</dt>
            <dd className="font-medium text-gray-900">{purchase.supplier}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Data</dt>
            <dd className="font-medium text-gray-900">{formatDate(purchase.purchase_date)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Nº NF</dt>
            <dd className="font-medium text-gray-900">{purchase.invoice_number ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Total</dt>
            <dd className="font-medium text-gray-900">R$ {Number(purchase.total_value).toFixed(2)}</dd>
          </div>
        </dl>
        {purchase.notes && (
          <div className="mt-3">
            <dt className="text-gray-500 text-sm">Observações</dt>
            <dd className="text-gray-900 mt-0.5">{purchase.notes}</dd>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Itens</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Produto</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Qtd</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Preço unit.</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2 text-sm text-gray-900">{item.products?.title ?? "—"}</td>
                  <td className="px-4 py-2 text-sm text-right text-gray-900">{item.quantity}</td>
                  <td className="px-4 py-2 text-sm text-right text-gray-900">
                    R$ {Number(item.unit_cost).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-gray-900 font-medium">
                    R$ {Number(item.subtotal).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {purchase.status === "PENDENTE" && (
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dashboard/compras/${purchase.id}/editar`}
            className="inline-flex items-center gap-2 rounded-lg bg-bmq-accent px-4 py-2 text-sm font-medium text-white hover:bg-bmq-mid"
          >
            Editar compra
          </Link>
          <ReceivePurchaseButton purchaseId={purchase.id} />
          <CancelPurchaseButton purchaseId={purchase.id} />
        </div>
      )}
      {purchase.status === "RECEBIDA" && (
        <CancelPurchaseButton purchaseId={purchase.id} received />
      )}
    </div>
  );
}
