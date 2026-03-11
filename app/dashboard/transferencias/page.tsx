import { createClient } from "@/lib/supabase/server";
import { TransferenciasPageClient } from "./TransferenciasPageClient";
import type { TransferStatus, Tables } from "@/types/database";

const PAGE_SIZE = 20;

type TransferRow = Tables<"stock_transfers"> & {
  products?: { title: string } | null;
};

export default async function TransferenciasPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    data_inicio?: string;
    data_fim?: string;
    page?: string;
    novo?: string;
  }>;
}) {
  const {
    status = "",
    data_inicio = "",
    data_fim = "",
    page: pageParam,
    novo,
  } = await searchParams;

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const supabase = await createClient();

  let query = supabase
    .from("stock_transfers")
    .select("*, products(title)", { count: "exact" })
    .order("transfer_date", { ascending: false });

  if (status) query = query.eq("status", status as TransferStatus);
  if (data_inicio) query = query.gte("transfer_date", `${data_inicio}T00:00:00`);
  if (data_fim) query = query.lte("transfer_date", `${data_fim}T23:59:59`);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: transfers, error, count } = await query.range(from, to);

  const list = (transfers ?? []) as TransferRow[];
  const total = count ?? 0;

  let products: { id: number; title: string }[] = [];
  let locations: { id: number; name: string }[] = [];
  if (novo === "1") {
    const [productsRes, locationsRes] = await Promise.all([
      supabase.from("products").select("id, title").order("title"),
      supabase.from("locations").select("id, name").order("name"),
    ]);
    products = (productsRes.data ?? []) as { id: number; title: string }[];
    locations = (locationsRes.data ?? []) as { id: number; name: string }[];
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">Erro ao carregar transferências: {error.message}</p>
      </div>
    );
  }

  return (
    <TransferenciasPageClient
      list={list}
      total={total}
      currentPage={page}
      status={status}
      data_inicio={data_inicio}
      data_fim={data_fim}
      products={products}
      locations={locations}
      openNew={novo === "1"}
    />
  );
}
