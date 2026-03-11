import { createClient } from "@/lib/supabase/server";
import { VendasPageClient } from "./VendasPageClient";
import type { ProductWithDefaultPrice } from "./SellForm";
import type { SellStatus, Tables } from "@/types/database";

const PAGE_SIZE = 20;

type SellRow = Tables<"sells"> & {
  clients?: { name: string } | null;
};
type SellWithItems = Tables<"sells"> & {
  sell_items?: { product_id: number; quantity: number; unitary_price: number | null }[];
};

function getMonthRange(mes: string): { data_inicio: string; data_fim: string } {
  const [y, m] = mes.split("-").map(Number);
  const first = `${mes}-01`;
  const lastDay = new Date(y, m, 0);
  const data_fim = `${y}-${String(m).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;
  return { data_inicio: first, data_fim };
}

export default async function VendasPage({
  searchParams,
}: {
  searchParams: Promise<{
    mes?: string;
    status?: string;
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
    .from("sells")
    .select("*, clients(name)", { count: "exact" })
    .order("data", { ascending: false });

  if (status) query = query.eq("status", status as SellStatus);
  if (data_inicio) query = query.gte("data", `${data_inicio}T00:00:00`);
  if (data_fim) query = query.lte("data", `${data_fim}T23:59:59`);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: sells, error, count } = await query.range(from, to);

  const list = (sells ?? []) as SellRow[];
  const total = count ?? 0;

  let clients: { id: number; name: string }[] = [];
  let products: ProductWithDefaultPrice[] = [];
  let sellToEdit: SellWithItems | null = null;

  if (novo === "1" || editar) {
    const [clientsRes, productsRes] = await Promise.all([
      supabase.from("clients").select("id, name").order("name"),
      supabase.from("products").select("id, title, sell_price, category_id, categories(price_default)"),
    ]);
    clients = (clientsRes.data ?? []) as { id: number; name: string }[];
    const productsRaw = (productsRes.data ?? []) as {
      id: number;
      title: string;
      sell_price: number | null;
      category_id: number;
      categories?: { price_default: number | null } | null;
    }[];
    products = productsRaw.map((p) => ({
      id: p.id,
      title: p.title,
      defaultPrice: Number(p.sell_price ?? p.categories?.price_default ?? 0),
    }));
  }
  if (editar && /^\d+$/.test(editar)) {
    const { data: one, error: err } = await supabase
      .from("sells")
      .select("*, sell_items(product_id, quantity, unitary_price)")
      .eq("id", Number(editar))
      .single();
    if (!err && one && (one as SellRow).status === "PENDENTE") {
      sellToEdit = one as SellWithItems;
    }
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">Erro ao carregar vendas: {error.message}</p>
      </div>
    );
  }

  return (
    <VendasPageClient
      list={list}
      total={total}
      currentPage={page}
      yearMonth={yearMonth}
      status={status}
      data_inicio={data_inicio}
      data_fim={data_fim}
      clients={clients}
      products={products}
      sellToEdit={sellToEdit}
      openNew={novo === "1"}
      editId={editar ?? null}
    />
  );
}
