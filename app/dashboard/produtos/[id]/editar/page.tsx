import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FiArrowLeft } from "react-icons/fi";
import { ProductForm } from "../../ProductForm";
import { PriceHistoryCard } from "../../PriceHistoryCard";
import { ProductStockCard } from "../../ProductStockCard";
import type { Tables } from "@/types/database";

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: productData, error: errProduct } = await supabase
    .from("products")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (errProduct || !productData) {
    notFound();
  }

  const product = productData as Tables<"products">;

  const { data: stockRows } = await supabase
    .from("stock")
    .select("*")
    .eq("product_id", product.id)
    .order("id", { ascending: true });
  const stocks = (stockRows ?? []) as Tables<"stock">[];
  const firstStock = stocks[0] ?? null;

  const { data: locationsData } = await supabase.from("locations").select("id, name").order("name");
  const locationsMap = new Map(
    ((locationsData ?? []) as { id: number; name: string }[]).map((l) => [l.id, l.name])
  );

  let priceHistory: Tables<"price_history">[] = [];
  if (firstStock) {
    const { data: historyData } = await supabase
      .from("price_history")
      .select("*")
      .eq("stock_id", firstStock.id)
      .order("created_at", { ascending: false })
      .limit(50);
    priceHistory = (historyData ?? []) as Tables<"price_history">[];
  }

  const [brandsRes, categoriesRes] = await Promise.all([
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("name"),
  ]);
  const brands = (brandsRes.data ?? []) as { id: number; name: string }[];
  const categories = (categoriesRes.data ?? []) as { id: number; name: string }[];

  return (
    <div className="p-8">
      <Link
        href="/dashboard/produtos"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <FiArrowLeft size={18} />
        Voltar
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar produto</h1>

      <div className="space-y-8">
        <ProductForm
          product={product}
          initialCostPrice={firstStock?.cost_price}
          initialMinQuantity={firstStock?.min_quantity}
          initialExpiryDate={firstStock?.expiry_date ?? undefined}
          brands={brands}
          categories={categories}
        />
        {product.track_stock && (
          <>
            <ProductStockCard productId={product.id} stocks={stocks} locationsMap={locationsMap} />
            {firstStock && <PriceHistoryCard history={priceHistory} />}
          </>
        )}
      </div>
    </div>
  );
}
