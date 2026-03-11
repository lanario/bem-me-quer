import { createClient } from "@/lib/supabase/server";
import { DevolucoesPageClient } from "./DevolucoesPageClient";
import type { ReturnStatus, Tables } from "@/types/database";

const PAGE_SIZE = 20;

type ReturnRow = Tables<"returns"> & {
  sells?: { id: number; data: string; clients?: { name: string } | null } | null;
};

export default async function DevolucoesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; novo?: string }>;
}) {
  const { status = "", page: pageParam, novo } = await searchParams;

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const supabase = await createClient();

  let query = supabase
    .from("returns")
    .select("*, sells(id, data, clients(name))", { count: "exact" })
    .order("return_date", { ascending: false });

  if (status) query = query.eq("status", status as ReturnStatus);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: returns, error, count } = await query.range(from, to);

  const list = (returns ?? []) as ReturnRow[];
  const total = count ?? 0;

  let sells: { id: number; label: string }[] = [];
  if (novo === "1") {
    const { data: sellsData } = await supabase
      .from("sells")
      .select("id, data, clients(name)")
      .eq("status", "CONCLUIDA")
      .order("data", { ascending: false });
    sells = ((sellsData ?? []) as { id: number; data: string; clients?: { name: string } | null }[]).map((s) => ({
      id: s.id,
      label: `#${s.id} · ${new Date(s.data).toLocaleDateString("pt-BR")}${s.clients?.name ? ` · ${s.clients.name}` : ""}`,
    }));
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">Erro ao carregar devoluções: {error.message}</p>
      </div>
    );
  }

  return (
    <DevolucoesPageClient
      list={list}
      total={total}
      currentPage={page}
      status={status}
      sells={sells}
      openNew={novo === "1"}
    />
  );
}
