import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import { CategoriasPageClient } from "./CategoriasPageClient";

export default async function CategoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ novo?: string; editar?: string }>;
}) {
  const { novo, editar } = await searchParams;
  const supabase = await createClient();
  const editId = editar && /^\d+$/.test(editar) ? Number(editar) : null;

  const [listResult, editResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, description, price_default")
      .order("name", { ascending: true }),
    editId
      ? supabase
          .from("categories")
          .select("id, name, description, price_default")
          .eq("id", editId)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const categories = (listResult.data ?? []) as Tables<"categories">[];
  const categoryToEdit = (editResult.data ?? null) as Tables<"categories"> | null;
  const error = listResult.error ?? editResult.error ?? null;

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">Erro ao carregar categorias: {error.message}</p>
      </div>
    );
  }

  return (
    <CategoriasPageClient
      categories={categories}
      categoryToEdit={categoryToEdit}
      openNew={novo === "1"}
      editId={editar ?? null}
    />
  );
}
