import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import { LocalizacoesPageClient } from "./LocalizacoesPageClient";

export type ProductInLocation = { title: string; quantity: number };

export default async function LocalizacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ novo?: string; editar?: string }>;
}) {
  const { novo, editar } = await searchParams;
  const supabase = await createClient();

  const editId = editar && /^\d+$/.test(editar) ? Number(editar) : null;

  const [
    { data, error },
    { data: stockData },
    editResult,
  ] = await Promise.all([
    supabase.from("locations").select("id, name, description").order("name", { ascending: true }),
    supabase.from("stock").select("location_id, quantity, products(title)").not("location_id", "is", null),
    editId
      ? supabase.from("locations").select("id, name, description").eq("id", editId).single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const locations = (data ?? []) as Tables<"locations">[];
  const stockRows = (stockData ?? []) as {
    location_id: number;
    quantity: number;
    products?: { title: string } | null;
  }[];

  const productsByLocation: Record<number, ProductInLocation[]> = {};
  for (const row of stockRows) {
    const locId = row.location_id;
    if (!productsByLocation[locId]) productsByLocation[locId] = [];
    productsByLocation[locId].push({
      title: row.products?.title ?? "Produto",
      quantity: row.quantity,
    });
  }

  const locationToEdit = (editResult.data ?? null) as Tables<"locations"> | null;
  const editError = "error" in editResult && editResult.error ? editResult.error : null;
  const resolvedError = error ?? editError;

  if (resolvedError) {
    return (
      <div className="p-8">
        <p className="text-red-600">Erro ao carregar localizações: {resolvedError.message}</p>
      </div>
    );
  }

  return (
    <LocalizacoesPageClient
      locations={locations}
      productsByLocation={productsByLocation}
      locationToEdit={locationToEdit}
      openNew={novo === "1"}
      editId={editar ?? null}
    />
  );
}
