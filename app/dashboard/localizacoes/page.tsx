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

  const [{ data, error }, { data: stockData }] = await Promise.all([
    supabase.from("locations").select("*").order("name", { ascending: true }),
    supabase.from("stock").select("location_id, quantity, products(title)").not("location_id", "is", null),
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

  let locationToEdit: Tables<"locations"> | null = null;
  if (editar && /^\d+$/.test(editar)) {
    const { data: one } = await supabase
      .from("locations")
      .select("*")
      .eq("id", Number(editar))
      .single();
    locationToEdit = one as Tables<"locations"> | null;
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">Erro ao carregar localizações: {error.message}</p>
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
