import { createClient } from "@/lib/supabase/server";
import { ProdutosPageClient } from "./ProdutosPageClient";
import type { ProductSize, Tables } from "@/types/database";

const PAGE_SIZE = 50;

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{
    busca?: string;
    marca?: string;
    categoria?: string;
    tamanho?: string;
    page?: string;
    novo?: string;
    editar?: string;
  }>;
}) {
  const {
    busca = "",
    marca = "",
    categoria = "",
    tamanho = "",
    page: pageParam,
    novo,
    editar,
  } = await searchParams;

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const supabase = await createClient();

  const [brandsRes, categoriesRes] = await Promise.all([
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("name"),
  ]);
  const brands = brandsRes.data ?? [];
  const categories = categoriesRes.data ?? [];

  let query = supabase
    .from("products")
    .select("*, brands(name), categories(name)", { count: "exact" });

  if (busca.trim()) {
    query = query.or(
      `title.ilike.%${busca.trim()}%,barcode.ilike.%${busca.trim()}%`
    );
  }
  if (marca) query = query.eq("brand_id", Number(marca));
  if (categoria) query = query.eq("category_id", Number(categoria));
  if (tamanho) query = query.eq("size", tamanho as ProductSize);

  query = query.order("title", { ascending: true });

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, error, count } = await query.range(from, to);
  const productsRaw = (data ?? []) as (Tables<"products"> & {
    brands?: { name: string };
    categories?: { name: string };
  })[];
  const productIds = productsRaw.map((p) => p.id);
  let stockByProduct: Record<
    number,
    { stock_id: number; cost_price: number; expiry_date: string | null; quantity: number; min_quantity: number }
  > = {};
  if (productIds.length > 0) {
    const { data: stockData } = await supabase
      .from("stock")
      .select("id, product_id, cost_price, expiry_date, quantity, min_quantity")
      .in("product_id", productIds);
    const rows = (stockData ?? []) as {
      id: number;
      product_id: number;
      cost_price: number;
      expiry_date: string | null;
      quantity: number;
      min_quantity: number;
    }[];
    for (const row of rows) {
      const cur = stockByProduct[row.product_id];
      if (!cur) {
        stockByProduct[row.product_id] = {
          stock_id: row.id,
          cost_price: row.cost_price,
          expiry_date: row.expiry_date,
          quantity: row.quantity,
          min_quantity: row.min_quantity,
        };
      } else {
        cur.quantity += row.quantity;
      }
    }
  }
  const products = productsRaw.map((p) => {
    const stock = stockByProduct[p.id];
    return {
      ...p,
      stock_id: stock?.stock_id ?? null,
      stock_cost_price: stock?.cost_price,
      stock_expiry_date: stock?.expiry_date ?? null,
      stock_quantity: stock?.quantity ?? 0,
      stock_min_quantity: stock?.min_quantity ?? 0,
    };
  });

  let productToEdit: Tables<"products"> | null = null;
  let initialCostPriceForEdit: number | null = null;
  let initialMinQuantityForEdit: number | null = null;
  let initialExpiryDateForEdit: string | null = null;
  if (editar && /^\d+$/.test(editar)) {
    const { data: one } = await supabase
      .from("products")
      .select("*")
      .eq("id", Number(editar))
      .single();
    productToEdit = one as Tables<"products"> | null;
    if (productToEdit) {
      const { data: stockRows } = await supabase
        .from("stock")
        .select("cost_price, min_quantity, expiry_date")
        .eq("product_id", productToEdit.id)
        .limit(1);
      const row = (stockRows ?? [])[0] as { cost_price: number; min_quantity: number; expiry_date: string | null } | undefined;
      initialCostPriceForEdit = row?.cost_price ?? null;
      initialMinQuantityForEdit = row?.min_quantity ?? null;
      initialExpiryDateForEdit = row?.expiry_date ?? null;
    }
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">Erro ao carregar produtos: {error.message}</p>
      </div>
    );
  }

  const total = count ?? 0;

  return (
    <ProdutosPageClient
      products={products}
      total={total}
      currentPage={page}
      busca={busca}
      marca={marca}
      categoria={categoria}
      tamanho={tamanho}
      brands={brands}
      categories={categories}
      productToEdit={productToEdit}
      initialCostPriceForEdit={initialCostPriceForEdit}
      initialMinQuantityForEdit={initialMinQuantityForEdit}
      initialExpiryDateForEdit={initialExpiryDateForEdit}
      openNew={novo === "1"}
      editId={editar ?? null}
    />
  );
}
