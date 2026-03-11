import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FiArrowLeft } from "react-icons/fi";
import { ProductForm } from "../ProductForm";

export default async function NovoProdutoPage() {
  const supabase = await createClient();
  const [brandsRes, categoriesRes] = await Promise.all([
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("name"),
  ]);
  const brands = brandsRes.data ?? [];
  const categories = categoriesRes.data ?? [];

  return (
    <div className="p-8">
      <Link
        href="/dashboard/produtos"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <FiArrowLeft size={18} />
        Voltar
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo produto</h1>
      <ProductForm brands={brands} categories={categories} />
    </div>
  );
}
