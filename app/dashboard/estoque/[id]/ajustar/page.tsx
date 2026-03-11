import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FiArrowLeft } from "react-icons/fi";
import { AjustarEstoqueForm } from "./AjustarEstoqueForm";
import type { Tables } from "@/types/database";

export default async function AjustarEstoquePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: stockData, error } = await supabase
    .from("stock")
    .select("*, products(title, barcode)")
    .eq("id", Number(id))
    .single();

  if (error || !stockData) {
    notFound();
  }

  const stock = stockData as Tables<"stock"> & {
    products?: { title: string; barcode: string | null } | null;
  };

  let locationName: string | null = stock.location ?? null;
  if (stock.location_id != null) {
    const { data: loc } = await supabase.from("locations").select("name").eq("id", stock.location_id).single();
    if (loc?.name) locationName = loc.name;
  }

  return (
    <div className="p-8">
      <Link
        href="/dashboard/estoque"
        className="inline-flex items-center gap-2 text-sm text-bmq-mid-dark hover:text-bmq-dark mb-6"
      >
        <FiArrowLeft size={18} />
        Voltar ao estoque
      </Link>
      <h1 className="text-2xl font-bold text-bmq-dark mb-2">Ajustar estoque</h1>
      <p className="text-bmq-mid-dark mb-6">
        {stock.products?.title ?? "Produto"} {stock.products?.barcode ? ` · ${stock.products.barcode}` : ""}
      </p>
      <div className="mb-6 rounded-lg border border-bmq-border bg-bmq-bg p-4">
        <p className="text-sm text-bmq-dark">
          <strong>Quantidade atual:</strong> {stock.quantity}
          {stock.min_quantity > 0 && (
            <> · Min: {stock.min_quantity}</>
          )}
          {locationName && <> · Local: {locationName}</>}
        </p>
      </div>
      <AjustarEstoqueForm stockId={stock.id} currentQuantity={stock.quantity} currentMinQuantity={stock.min_quantity} />
    </div>
  );
}
