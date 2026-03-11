import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FiArrowLeft } from "react-icons/fi";
import type { Tables } from "@/types/database";
import { BrandForm } from "../../BrandForm";

export default async function EditarMarcaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: brand, error } = await supabase
    .from("brands")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (error || !brand) {
    notFound();
  }

  return (
    <div className="p-8">
      <Link
        href="/dashboard/marcas"
        className="inline-flex items-center gap-2 text-sm text-bmq-mid-dark hover:text-bmq-dark mb-6"
      >
        <FiArrowLeft size={18} />
        Voltar
      </Link>
      <h1 className="text-2xl font-bold text-bmq-dark mb-6">Editar marca</h1>
      <BrandForm brand={brand as Tables<"brands">} />
    </div>
  );
}
