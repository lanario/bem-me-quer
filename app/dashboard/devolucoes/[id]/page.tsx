import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FiArrowLeft } from "react-icons/fi";
import { ApproveReturnButton } from "../ApproveReturnButton";
import { RejectReturnButton } from "../RejectReturnButton";
import type { Tables } from "@/types/database";

type ReturnRow = Tables<"returns"> & {
  sells?: { id: number; data: string; clients?: { name: string } | null } | null;
};
type ReturnItemRow = Tables<"return_items"> & {
  sell_items?: { quantity: number; products?: { title: string } | null } | null;
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

const REASON_LABEL: Record<ReturnRow["reason"], string> = {
  DEFEITO: "Defeito",
  TROCA: "Troca",
  DESISTENCIA: "Desistência",
  OUTRO: "Outro",
};

const CONDITION_LABEL: Record<ReturnItemRow["condition"], string> = {
  NOVO: "Novo",
  USADO: "Usado",
  DANIFICADO: "Danificado",
};

export default async function DevolucaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: returnData, error } = await supabase
    .from("returns")
    .select("*, sells(id, data, clients(name))")
    .eq("id", Number(id))
    .single();

  if (error || !returnData) {
    notFound();
  }

  const ret = returnData as ReturnRow;
  const { data: itemsData } = await supabase
    .from("return_items")
    .select("*, sell_items(quantity, products(title))")
    .eq("return_id", ret.id);
  const items = (itemsData ?? []) as ReturnItemRow[];
  const badge = statusBadge(ret.status);
  const sell = ret.sells as { id: number; data: string; clients?: { name: string } | null } | undefined;

  return (
    <div className="p-8">
      <Link
        href="/dashboard/devolucoes"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <FiArrowLeft size={18} />
        Voltar
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Devolução #{ret.id}</h1>
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500">Venda</dt>
            <dd className="font-medium text-gray-900">
              #{sell?.id ?? "—"} {sell?.clients?.name ? ` · ${sell.clients.name}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Data</dt>
            <dd className="font-medium text-gray-900">{formatDate(ret.return_date)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Motivo</dt>
            <dd className="font-medium text-gray-900">{REASON_LABEL[ret.reason]}</dd>
          </div>
        </dl>
        {ret.notes && (
          <div className="mt-3">
            <dt className="text-gray-500 text-sm">Observações</dt>
            <dd className="text-gray-900 mt-0.5">{ret.notes}</dd>
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
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Qtd devolvida</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Condição</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Repor estoque</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {item.sell_items?.products?.title ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-gray-900">{item.quantity}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {CONDITION_LABEL[item.condition]}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {item.restock ? "Sim" : "Não"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {ret.status === "PENDENTE" && (
        <div className="flex flex-wrap gap-3">
          <ApproveReturnButton returnId={ret.id} />
          <RejectReturnButton returnId={ret.id} />
        </div>
      )}
      {ret.status === "APROVADA" && (
        <RejectReturnButton returnId={ret.id} wasApproved />
      )}
    </div>
  );
}
