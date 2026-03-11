import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import { ClientesPageClient } from "./ClientesPageClient";

const PAGE_SIZE = 20;

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{
    busca?: string;
    ordem?: string;
    page?: string;
    novo?: string;
    editar?: string;
  }>;
}) {
  const {
    busca = "",
    ordem = "name",
    page: pageParam,
    novo,
    editar,
  } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const supabase = await createClient();

  let query = supabase.from("clients").select("*", { count: "exact" });

  if (busca.trim()) {
    query = query.or(
      `name.ilike.%${busca.trim()}%,email.ilike.%${busca.trim()}%,phone.ilike.%${busca.trim()}%`
    );
  }

  const validOrder = ["name", "email", "created_at"].includes(ordem)
    ? ordem
    : "name";
  query = query.order(validOrder, { ascending: true });

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, error, count } = await query.range(from, to);
  const clients = (data ?? []) as Tables<"clients">[];
  const total = count ?? 0;

  let clientToEdit: Tables<"clients"> | null = null;
  if (editar && /^\d+$/.test(editar)) {
    const { data: one } = await supabase
      .from("clients")
      .select("*")
      .eq("id", Number(editar))
      .single();
    clientToEdit = one as Tables<"clients"> | null;
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">Erro ao carregar clientes: {error.message}</p>
      </div>
    );
  }

  return (
    <ClientesPageClient
      clients={clients}
      total={total}
      currentPage={page}
      busca={busca}
      ordem={ordem}
      clientToEdit={clientToEdit}
      openNew={novo === "1"}
      editId={editar ?? null}
    />
  );
}
