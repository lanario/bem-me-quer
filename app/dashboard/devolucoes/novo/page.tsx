import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FiArrowLeft } from "react-icons/fi";
import { ReturnForm } from "../ReturnForm";

export default async function NovaDevolucaoPage() {
  const supabase = await createClient();
  const { data: sellsData } = await supabase
    .from("sells")
    .select("id, data, clients(name)")
    .eq("status", "CONCLUIDA")
    .order("data", { ascending: false });

  const sells = ((sellsData ?? []) as { id: number; data: string; clients?: { name: string } | null }[]).map(
    (s) => ({
      id: s.id,
      label: `#${s.id} · ${new Date(s.data).toLocaleDateString("pt-BR")}${s.clients?.name ? ` · ${s.clients.name}` : ""}`,
    })
  );

  return (
    <div className="p-8">
      <Link
        href="/dashboard/devolucoes"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <FiArrowLeft size={18} />
        Voltar
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nova devolução</h1>
      {sells.length === 0 ? (
        <p className="text-gray-600">
          Não há vendas concluídas. Conclua uma venda antes de registrar uma devolução.
        </p>
      ) : (
        <ReturnForm sells={sells} />
      )}
    </div>
  );
}
