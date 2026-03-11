import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FiArrowLeft } from "react-icons/fi";
import type { Tables } from "@/types/database";
import { ClientForm } from "../../ClientForm";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (error || !client) {
    notFound();
  }

  return (
    <div className="p-8">
      <Link
        href="/dashboard/clientes"
        className="inline-flex items-center gap-2 text-sm text-bmq-mid-dark hover:text-bmq-dark mb-6"
      >
        <FiArrowLeft size={18} />
        Voltar
      </Link>
      <h1 className="text-2xl font-bold text-bmq-dark mb-6">Editar cliente</h1>
      <ClientForm client={client as Tables<"clients">} />
    </div>
  );
}
