import { createClient } from "@/lib/supabase/server";
import { ComprasPageClient } from "./ComprasPageClient";
import type { PurchaseStatus, Tables } from "@/types/database";

const PAGE_SIZE = 20;

type PurchaseRow = Tables<"purchases">;
type PurchaseWithItems = Tables<"purchases"> & {
  purchase_items?: { product_id: number; quantity: number; unit_cost: number }[];
};

function getMonthRange(mes: string): { data_inicio: string; data_fim: string } {
  const [y, m] = mes.split("-").map(Number);
  const first = `${mes}-01`;
  const lastDay = new Date(y, m, 0);
  const data_fim = `${y}-${String(m).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;
  return { data_inicio: first, data_fim };
}

export default async function ComprasPage({
  searchParams,
}: {
  searchParams: Promise<{
    mes?: string;
    status?: string;
    fornecedor?: string;
    data_inicio?: string;
    data_fim?: string;
    page?: string;
    novo?: string;
    editar?: string;
  }>;
}) {
  const {
    mes: mesParam = "",
    status = "",
    fornecedor = "",
    data_inicio: dataInicioParam = "",
    data_fim: dataFimParam = "",
    page: pageParam,
    novo,
    editar,
  } = await searchParams;

  let data_inicio = dataInicioParam;
  let data_fim = dataFimParam;
  let yearMonth: string;
  const today = new Date();
  const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  if (mesParam && /^\d{4}-\d{2}$/.test(mesParam)) {
    const range = getMonthRange(mesParam);
    data_inicio = range.data_inicio;
    data_fim = range.data_fim;
    yearMonth = mesParam;
  } else if (!data_inicio && !data_fim) {
    const range = getMonthRange(currentYearMonth);
    data_inicio = range.data_inicio;
    data_fim = range.data_fim;
    yearMonth = currentYearMonth;
  } else {
    yearMonth = data_inicio && /^\d{4}-\d{2}-\d{2}$/.test(data_inicio) ? data_inicio.slice(0, 7) : currentYearMonth;
  }

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const supabase = await createClient();

  let query = supabase
    .from("purchases")
    .select("*", { count: "exact" })
    .order("purchase_date", { ascending: false });

  if (status) query = query.eq("status", status as PurchaseStatus);
  if (fornecedor.trim()) query = query.ilike("supplier", `%${fornecedor.trim()}%`);
  if (data_inicio) query = query.gte("purchase_date", data_inicio);
  if (data_fim) query = query.lte("purchase_date", data_fim);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const [{ data: purchases, error, count }, { data: suppliersData }] = await Promise.all([
    query.range(from, to),
    supabase.from("purchases").select("supplier").not("supplier", "is", null),
  ]);

  const list = (purchases ?? []) as PurchaseRow[];
  const suppliers = Array.from(new Set((suppliersData ?? []).map((r) => (r as { supplier: string }).supplier))).sort();
  const total = count ?? 0;

  let purchaseToEdit: PurchaseWithItems | null = null;
  let products: { id: number; title: string }[] = [];
  if (novo === "1" || editar) {
    const { data: productsData } = await supabase
      .from("products")
      .select("id, title")
      .order("title");
    products = (productsData ?? []) as { id: number; title: string }[];
  }
  if (editar && /^\d+$/.test(editar)) {
    const { data: one, error: err } = await supabase
      .from("purchases")
      .select("*, purchase_items(product_id, quantity, unit_cost)")
      .eq("id", Number(editar))
      .single();
    if (!err && one && (one as PurchaseRow).status === "PENDENTE") {
      purchaseToEdit = one as PurchaseWithItems;
    }
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">Erro ao carregar compras: {error.message}</p>
      </div>
    );
  }

  return (
    <ComprasPageClient
      list={list}
      total={total}
      currentPage={page}
      yearMonth={yearMonth}
      status={status}
      fornecedor={fornecedor}
      data_inicio={data_inicio}
      data_fim={data_fim}
      suppliers={suppliers}
      products={products}
      purchaseToEdit={purchaseToEdit}
      openNew={novo === "1"}
      editId={editar ?? null}
    />
  );
}
