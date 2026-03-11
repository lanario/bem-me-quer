import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FiArrowLeft } from "react-icons/fi";
import type { Tables } from "@/types/database";
import { CategoryForm } from "../../CategoryForm";

export default async function EditarCategoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: category, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (error || !category) {
    notFound();
  }

  return (
    <div className="p-8">
      <Link
        href="/dashboard/categorias"
        className="inline-flex items-center gap-2 text-sm text-bmq-mid-dark hover:text-bmq-dark mb-6"
      >
        <FiArrowLeft size={18} />
        Voltar
      </Link>
      <h1 className="text-2xl font-bold text-bmq-dark mb-6">Editar categoria</h1>
      <CategoryForm category={category as Tables<"categories">} />
    </div>
  );
}
