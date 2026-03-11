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

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });
  const categories = (data ?? []) as Tables<"categories">[];

  let categoryToEdit: Tables<"categories"> | null = null;
  if (editar && /^\d+$/.test(editar)) {
    const { data: one } = await supabase
      .from("categories")
      .select("*")
      .eq("id", Number(editar))
      .single();
    categoryToEdit = one as Tables<"categories"> | null;
  }

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
