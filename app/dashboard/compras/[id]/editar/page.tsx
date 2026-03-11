import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FiArrowLeft } from "react-icons/fi";
import { PurchaseForm } from "../../PurchaseForm";
import type { Tables } from "@/types/database";

type PurchaseWithItems = Tables<"purchases"> & {
  purchase_items?: { product_id: number; quantity: number; unit_cost: number }[];
};

export default async function EditarCompraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: purchaseData, error } = await supabase
    .from("purchases")
    .select("*, purchase_items(product_id, quantity, unit_cost)")
    .eq("id", Number(id))
    .single();

  if (error || !purchaseData) {
    notFound();
  }

  const purchase = purchaseData as PurchaseWithItems;
  if (purchase.status !== "PENDENTE") {
    return (
      <div className="p-8">
        <p className="text-amber-700">
          Apenas compras com status Pendente podem ser editadas.
        </p>
        <Link href="/dashboard/compras" className="mt-4 inline-block text-bmq-mid-dark hover:underline">
          Voltar à listagem
        </Link>
      </div>
    );
  }

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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar compra #{purchase.id}</h1>
      <PurchaseForm products={products} purchase={purchase} />
    </div>
  );
}
