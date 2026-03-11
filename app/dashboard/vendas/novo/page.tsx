import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FiArrowLeft } from "react-icons/fi";
import { SellForm, type ProductWithDefaultPrice } from "../SellForm";

export default async function NovaVendaPage() {
  const supabase = await createClient();
  const [clientsRes, productsRes] = await Promise.all([
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("products").select("id, title, sell_price, category_id, categories(price_default)"),
  ]);

  const clients = (clientsRes.data ?? []) as { id: number; name: string }[];
  const productsRaw = (productsRes.data ?? []) as {
    id: number;
    title: string;
    sell_price: number | null;
    category_id: number;
    categories?: { price_default: number | null } | null;
  }[];
  const products: ProductWithDefaultPrice[] = productsRaw.map((p) => ({
    id: p.id,
    title: p.title,
    defaultPrice: Number(p.sell_price ?? p.categories?.price_default ?? 0),
  }));

  return (
    <div className="p-8">
      <Link
        href="/dashboard/vendas"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <FiArrowLeft size={18} />
        Voltar
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nova venda</h1>
      {clients.length === 0 ? (
        <p className="text-gray-600">Cadastre ao menos um cliente antes de criar uma venda.</p>
      ) : products.length === 0 ? (
        <p className="text-gray-600">Cadastre ao menos um produto antes de criar uma venda.</p>
      ) : (
        <SellForm clients={clients} products={products} />
      )}
    </div>
  );
}
