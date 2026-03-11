import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FiArrowLeft } from "react-icons/fi";
import { TransferForm } from "../TransferForm";

export default async function NovaTransferenciaPage() {
  const supabase = await createClient();
  const [productsRes, locationsRes] = await Promise.all([
    supabase.from("products").select("id, title").order("title"),
    supabase.from("locations").select("id, name").order("name"),
  ]);
  const products = (productsRes.data ?? []) as { id: number; title: string }[];
  const locations = (locationsRes.data ?? []) as { id: number; name: string }[];

  return (
    <div className="p-8">
      <Link
        href="/dashboard/transferencias"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <FiArrowLeft size={18} />
        Voltar
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nova transferência</h1>
      {products.length === 0 ? (
        <p className="text-gray-600">Cadastre ao menos um produto antes de criar uma transferência.</p>
      ) : (
        <TransferForm products={products} locations={locations} />
      )}
    </div>
  );
}
