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

  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("name", { ascending: true });
  const brands = (data ?? []) as Tables<"brands">[];

  let brandToEdit: Tables<"brands"> | null = null;
  if (editar && /^\d+$/.test(editar)) {
    const { data: one } = await supabase
      .from("brands")
      .select("*")
      .eq("id", Number(editar))
      .single();
    brandToEdit = one as Tables<"brands"> | null;
  }

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
