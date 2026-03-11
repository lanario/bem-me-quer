import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FiArrowLeft } from "react-icons/fi";
import { SellForm, type ProductWithDefaultPrice } from "../../SellForm";
import type { Tables } from "@/types/database";

type SellWithItems = Tables<"sells"> & {
  sell_items?: { product_id: number; quantity: number; unitary_price: number | null }[];
};

export default async function EditarVendaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: sellData, error } = await supabase
    .from("sells")
    .select("*, sell_items(product_id, quantity, unitary_price)")
    .eq("id", Number(id))
    .single();

  if (error || !sellData) {
    notFound();
  }

  const sell = sellData as SellWithItems;
  if (sell.status !== "PENDENTE") {
    return (
      <div className="p-8">
        <p className="text-amber-700">
          Apenas vendas com status Pendente podem ser editadas.
        </p>
        <Link href="/dashboard/vendas" className="mt-4 inline-block text-bmq-mid-dark hover:underline">
          Voltar à listagem
        </Link>
      </div>
    );
  }

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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar venda #{sell.id}</h1>
      <SellForm clients={clients} products={products} sell={sell} />
    </div>
  );
}
