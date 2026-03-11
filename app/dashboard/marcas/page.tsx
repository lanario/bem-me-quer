import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import { MarcasPageClient } from "./MarcasPageClient";

export default async function MarcasPage({
  searchParams,
}: {
  searchParams: Promise<{ novo?: string; editar?: string }>;
}) {
  const { novo, editar } = await searchParams;
  const supabase = await createClient();
  const editId = editar && /^\d+$/.test(editar) ? Number(editar) : null;

  const [listResult, editResult] = await Promise.all([
    supabase.from("brands").select("id, name, description").order("name", { ascending: true }),
    editId
      ? supabase.from("brands").select("id, name, description").eq("id", editId).single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const brands = (listResult.data ?? []) as Tables<"brands">[];
  const brandToEdit = (editResult.data ?? null) as Tables<"brands"> | null;
  const error = listResult.error ?? editResult.error ?? null;

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">Erro ao carregar marcas: {error.message}</p>
      </div>
    );
  }

  return (
    <MarcasPageClient
      brands={brands}
      brandToEdit={brandToEdit}
      openNew={novo === "1"}
      editId={editar ?? null}
    />
  );
}
