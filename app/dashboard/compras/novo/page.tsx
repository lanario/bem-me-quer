import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FiArrowLeft } from "react-icons/fi";
import { PurchaseForm } from "../PurchaseForm";

export default async function NovaCompraPage() {
  const supabase = await createClient();
  const { data: productsData } = await supabase
    .from("products")
    .select("id, title")
    .order("title");
  const products = (productsData ?? []) as { id: number; title: string }[];

  return (
    <div className="p-8">
      <Link
        href="/dashboard/compras"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <FiArrowLeft size={18} />
        Voltar
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nova compra</h1>
      {products.length === 0 ? (
        <p className="text-gray-600">
          Cadastre ao menos um produto antes de criar uma compra.
        </p>
      ) : (
        <PurchaseForm products={products} />
      )}
    </div>
  );
}
