import { createClient } from "@/lib/supabase/server";
import { EstoquePageClient, type StockRow } from "./EstoquePageClient";

const PAGE_SIZE = 50;

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{
    busca?: string;
    categoria?: string;
    marca?: string;
    status?: string;
    validade?: string;
    page?: string;
  }>;
}) {
  const { busca = "", categoria = "", marca = "", status = "", validade = "", page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const supabase = await createClient();

  const [brandsRes, categoriesRes, locationsRes] = await Promise.all([
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("locations").select("id, name").order("name"),
  ]);
  const brands = (brandsRes.data ?? []) as { id: number; name: string }[];
  const categories = (categoriesRes.data ?? []) as { id: number; name: string }[];
  const locations = (locationsRes.data ?? []) as { id: number; name: string }[];
  const locationsMap = new Map(locations.map((l) => [l.id, l.name]));

  const { data: rawData, error } = await supabase
    .from("stock")
    .select(
      "*, products(title, barcode, brand_id, category_id, brands(name), categories(name))"
    )
    .order("product_id");

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">Erro ao carregar estoque: {error.message}</p>
      </div>
    );
  }

  const allStocks = (rawData ?? []) as StockRow[];

  // Filtros em memória: busca, categoria, marca, status, validade
  let stocks = allStocks;
  const buscaLower = busca.trim().toLowerCase();
  if (buscaLower) {
    stocks = stocks.filter((s) => {
      const title = s.products?.title?.toLowerCase() ?? "";
      const barcode = s.products?.barcode?.toLowerCase() ?? "";
      const locName = locationsMap.get(s.location_id) ?? s.location ?? "";
      const loc = locName.toLowerCase();
      return title.includes(buscaLower) || barcode.includes(buscaLower) || loc.includes(buscaLower);
    });
  }
  if (categoria) stocks = stocks.filter((s) => String(s.products?.category_id) === categoria);
  if (marca) stocks = stocks.filter((s) => String(s.products?.brand_id) === marca);
  if (status === "out") stocks = stocks.filter((s) => s.quantity === 0);
  else if (status === "low") stocks = stocks.filter((s) => s.quantity > 0 && s.min_quantity > 0 && s.quantity <= s.min_quantity);
  else if (status === "ok") stocks = stocks.filter((s) => s.quantity > s.min_quantity || s.min_quantity === 0);
  if (validade === "vencido") stocks = stocks.filter((s) => s.expiry_date && new Date(s.expiry_date) < new Date());
  else if (validade === "proximo") {
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    stocks = stocks.filter((s) => s.expiry_date && new Date(s.expiry_date) >= new Date() && new Date(s.expiry_date) <= in30);
  } else if (validade === "valido") stocks = stocks.filter((s) => !s.expiry_date || new Date(s.expiry_date) > new Date(new Date().setDate(new Date().getDate() + 30)));

  const total = stocks.length;
  const from = (page - 1) * PAGE_SIZE;
  const stocksPage = stocks.slice(from, from + PAGE_SIZE);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-bmq-dark mb-6">Estoque</h1>
      <EstoquePageClient
        stocksPage={stocksPage}
        total={total}
        currentPage={page}
        basePath="/dashboard/estoque"
        busca={busca}
        categoria={categoria}
        marca={marca}
        status={status}
        validade={validade}
        brands={brands}
        categories={categories}
        locationNamesById={Object.fromEntries(locationsMap)}
      />
    </div>
  );
}
