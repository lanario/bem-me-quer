import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FiArrowLeft } from "react-icons/fi";
import { ConfirmTransferButton } from "../ConfirmTransferButton";
import { CancelTransferButton } from "../CancelTransferButton";
import type { Tables } from "@/types/database";

type TransferRow = Tables<"stock_transfers"> & { products?: { title: string } | null };

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

export default async function TransferenciaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: transferData, error } = await supabase
    .from("stock_transfers")
    .select("*, products(title)")
    .eq("id", Number(id))
    .single();

  if (error || !transferData) {
    notFound();
  }

  const transfer = transferData as TransferRow;
  const badge = statusBadge(transfer.status);

  return (
    <div className="p-8">
      <Link
        href="/dashboard/transferencias"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <FiArrowLeft size={18} />
        Voltar
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transferência #{transfer.id}</h1>
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500">Origem</dt>
            <dd className="font-medium text-gray-900">{transfer.from_location}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Destino</dt>
            <dd className="font-medium text-gray-900">{transfer.to_location}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Produto</dt>
            <dd className="font-medium text-gray-900">{transfer.products?.title ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Quantidade</dt>
            <dd className="font-medium text-gray-900">{transfer.quantity}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Data</dt>
            <dd className="font-medium text-gray-900">{formatDateTime(transfer.transfer_date)}</dd>
          </div>
        </dl>
        {transfer.notes && (
          <div className="mt-3">
            <dt className="text-gray-500 text-sm">Observações</dt>
            <dd className="text-gray-900 mt-0.5">{transfer.notes}</dd>
          </div>
        )}
      </div>

      {transfer.status === "PENDENTE" && (
        <div className="flex flex-wrap gap-3">
          <ConfirmTransferButton transferId={transfer.id} />
          <CancelTransferButton transferId={transfer.id} />
        </div>
      )}
      {transfer.status === "CONCLUIDA" && (
        <CancelTransferButton transferId={transfer.id} concluded />
      )}
    </div>
  );
}
