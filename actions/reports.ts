"use server";

import { createClient } from "@/lib/supabase/server";
import type { MovementReason, MovementType } from "@/types/database";

function escapeCsv(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Gera CSV do relatório Estoque Atual (mesmos critérios da listagem).
 */
export async function getEstoqueAtualCsv(params: {
  busca?: string;
  categoria?: string;
  marca?: string;
  status?: string;
  validade?: string;
}): Promise<{ csv: string; filename: string }> {
  const supabase = await createClient();
  const [locationsRes, { data }] = await Promise.all([
    supabase.from("locations").select("id, name").order("name"),
    supabase.from("stock").select("*, products(title, barcode, brand_id, category_id, brands(name), categories(name))").order("product_id"),
  ]);
  const locations = (locationsRes.data ?? []) as { id: number; name: string }[];
  const locationsMap = new Map(locations.map((l) => [l.id, l.name]));
  let rows = (data ?? []) as {
    location_id: number | null;
    quantity: number;
    min_quantity: number;
    max_quantity: number | null;
    location: string | null;
    cost_price: number;
    expiry_date: string | null;
    products?: { title: string; barcode: string | null; brands?: { name: string } | null; categories?: { name: string } | null } | null;
  }[];
  const busca = (params.busca ?? "").trim().toLowerCase();
  if (busca) {
    rows = rows.filter((s) => {
      const title = s.products?.title?.toLowerCase() ?? "";
      const barcode = s.products?.barcode?.toLowerCase() ?? "";
      const locName = locationsMap.get(s.location_id ?? 0) ?? s.location ?? "";
      const loc = locName.toLowerCase();
      return title.includes(busca) || barcode.includes(busca) || loc.includes(busca);
    });
  }
  if (params.categoria) rows = rows.filter((s) => String((s.products as { category_id?: number })?.category_id) === params.categoria);
  if (params.marca) rows = rows.filter((s) => String((s.products as { brand_id?: number })?.brand_id) === params.marca);
  if (params.status === "out") rows = rows.filter((s) => s.quantity === 0);
  else if (params.status === "low") rows = rows.filter((s) => s.quantity > 0 && s.min_quantity > 0 && s.quantity <= s.min_quantity);
  else if (params.status === "ok") rows = rows.filter((s) => s.quantity > s.min_quantity || s.min_quantity === 0);
  const today = new Date();
  if (params.validade === "vencido") rows = rows.filter((s) => s.expiry_date && new Date(s.expiry_date) < today);
  else if (params.validade === "proximo") {
    const in30 = new Date(today);
    in30.setDate(in30.getDate() + 30);
    rows = rows.filter((s) => s.expiry_date && new Date(s.expiry_date) >= today && new Date(s.expiry_date) <= in30);
  } else if (params.validade === "valido") {
    const in30 = new Date(today);
    in30.setDate(in30.getDate() + 30);
    rows = rows.filter((s) => !s.expiry_date || new Date(s.expiry_date) > in30);
  }
  const headers = ["Produto", "Marca", "Categoria", "Quantidade", "Min", "Max", "Localização", "Preço custo", "Valor total", "Status", "Validade"];
  const lines = [headers.map(escapeCsv).join(",")];
  for (const s of rows) {
    const totalValue = s.quantity * Number(s.cost_price);
    let status = "OK";
    if (s.quantity === 0) status = "Sem estoque";
    else if (s.min_quantity > 0 && s.quantity <= s.min_quantity) status = "Estoque baixo";
    const validity = s.expiry_date ? new Date(s.expiry_date).toLocaleDateString("pt-BR") : "";
    const locationName = (s.location_id != null ? locationsMap.get(s.location_id) : null) ?? s.location ?? "";
    lines.push([
      s.products?.title ?? "",
      s.products?.brands?.name ?? "",
      s.products?.categories?.name ?? "",
      s.quantity,
      s.min_quantity,
      s.max_quantity ?? "",
      locationName,
      Number(s.cost_price).toFixed(2),
      totalValue.toFixed(2),
      status,
      validity,
    ].map(escapeCsv).join(","));
  }
  const csv = "\uFEFF" + lines.join("\r\n");
  return { csv, filename: `estoque-atual-${new Date().toISOString().slice(0, 10)}.csv` };
}

/**
 * Gera CSV do relatório Movimentações (filtros: tipo, motivo, produto, data início/fim).
 */
export async function getMovimentacoesCsv(params: {
  tipo?: string;
  motivo?: string;
  produto?: string;
  data_inicio?: string;
  data_fim?: string;
}): Promise<{ csv: string; filename: string }> {
  const supabase = await createClient();
  let query = supabase.from("stock_movements").select("*, stock(products(title))").order("created_at", { ascending: false });
  if (params.tipo) query = query.eq("movement_type", params.tipo as MovementType);
  if (params.motivo) query = query.eq("reason", params.motivo as MovementReason);
  if (params.produto) {
    const { data: stockIds } = await supabase.from("stock").select("id").eq("product_id", Number(params.produto));
    const ids = (stockIds ?? []).map((s) => (s as { id: number }).id);
    if (ids.length) query = query.in("stock_id", ids);
    else query = query.eq("stock_id", -1);
  }
  if (params.data_inicio) query = query.gte("created_at", `${params.data_inicio}T00:00:00`);
  if (params.data_fim) query = query.lte("created_at", `${params.data_fim}T23:59:59`);
  const { data } = await query;
  const rows = (data ?? []) as { created_at: string; movement_type: string; reason: string; quantity: number; quantity_before: number | null; reference: string | null; notes: string | null; stock?: { products?: { title: string } | null } | null }[];
  const headers = ["Data", "Produto", "Tipo", "Motivo", "Quantidade", "Antes", "Depois", "Referência", "Observações"];
  const lines = [headers.map(escapeCsv).join(",")];
  for (const m of rows) {
    const after = m.quantity_before != null ? m.quantity_before + m.quantity : "";
    lines.push([
      new Date(m.created_at).toLocaleString("pt-BR"),
      m.stock?.products?.title ?? "",
      m.movement_type,
      m.reason,
      m.quantity,
      m.quantity_before ?? "",
      after,
      m.reference ?? "",
      (m.notes ?? "").replace(/\r?\n/g, " "),
    ].map(escapeCsv).join(","));
  }
  const csv = "\uFEFF" + lines.join("\r\n");
  return { csv, filename: `movimentacoes-${new Date().toISOString().slice(0, 10)}.csv` };
}

/**
 * Gera CSV do relatório Estoque Baixo (quantidade <= min_quantity, excl. zero); sugestão de compra = min - quantity.
 */
export async function getEstoqueBaixoCsv(): Promise<{ csv: string; filename: string }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stock")
    .select("*, products(title, brands(name), categories(name))")
    .order("product_id");
  const all = (data ?? []) as { quantity: number; min_quantity: number; cost_price: number; products?: { title: string; brands?: { name: string }; categories?: { name: string } } | null }[];
  const rows = all.filter((s) => s.min_quantity > 0 && s.quantity <= s.min_quantity && s.quantity >= 0);
  const headers = ["Produto", "Marca", "Categoria", "Quantidade", "Mínimo", "Sugestão compra", "Preço custo"];
  const lines = [headers.map(escapeCsv).join(",")];
  for (const s of rows) {
    const sug = Math.max(0, s.min_quantity - s.quantity);
    lines.push([
      s.products?.title ?? "",
      s.products?.brands?.name ?? "",
      s.products?.categories?.name ?? "",
      s.quantity,
      s.min_quantity,
      sug,
      Number(s.cost_price).toFixed(2),
    ].map(escapeCsv).join(","));
  }
  const csv = "\uFEFF" + lines.join("\r\n");
  return { csv, filename: `estoque-baixo-${new Date().toISOString().slice(0, 10)}.csv` };
}

/**
 * Gera CSV do relatório Valor de Estoque (por categoria, por marca, total).
 */
export async function getValorEstoqueCsv(): Promise<{ csv: string; filename: string }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stock")
    .select("quantity, cost_price, products(category_id, categories(name), brand_id, brands(name))");
  const all = (data ?? []) as {
    quantity: number;
    cost_price: number;
    products?: { categories?: { name: string } | null; brands?: { name: string } | null } | null;
  }[];
  const byCategory: Record<string, { produtos: number; quantidade: number; valor: number }> = {};
  const byBrand: Record<string, { produtos: number; quantidade: number; valor: number }> = {};
  let totalProdutos = 0, totalQty = 0, totalValor = 0;
  for (const s of all) {
    const valor = s.quantity * Number(s.cost_price);
    const cat = s.products?.categories?.name ?? "Sem categoria";
    const brand = s.products?.brands?.name ?? "Sem marca";
    if (!byCategory[cat]) byCategory[cat] = { produtos: 0, quantidade: 0, valor: 0 };
    byCategory[cat].produtos += 1;
    byCategory[cat].quantidade += s.quantity;
    byCategory[cat].valor += valor;
    if (!byBrand[brand]) byBrand[brand] = { produtos: 0, quantidade: 0, valor: 0 };
    byBrand[brand].produtos += 1;
    byBrand[brand].quantidade += s.quantity;
    byBrand[brand].valor += valor;
    totalProdutos += 1;
    totalQty += s.quantity;
    totalValor += valor;
  }
  const lines: string[] = ["\uFEFFRelatório Valor de Estoque", ""];
  lines.push("Por Categoria");
  lines.push(["Categoria", "Produtos", "Quantidade", "Valor (R$)"].map(escapeCsv).join(","));
  for (const [name, v] of Object.entries(byCategory).sort((a, b) => b[1].valor - a[1].valor)) {
    lines.push([name, v.produtos, v.quantidade, v.valor.toFixed(2)].map(escapeCsv).join(","));
  }
  lines.push("");
  lines.push("Por Marca");
  lines.push(["Marca", "Produtos", "Quantidade", "Valor (R$)"].map(escapeCsv).join(","));
  for (const [name, v] of Object.entries(byBrand).sort((a, b) => b[1].valor - a[1].valor)) {
    lines.push([name, v.produtos, v.quantidade, v.valor.toFixed(2)].map(escapeCsv).join(","));
  }
  lines.push("");
  lines.push("Total geral");
  lines.push(["Produtos", "Quantidade", "Valor (R$)"].map(escapeCsv).join(","));
  lines.push([totalProdutos, totalQty, totalValor.toFixed(2)].map(escapeCsv).join(","));
  const csv = lines.join("\r\n");
  return { csv, filename: `valor-estoque-${new Date().toISOString().slice(0, 10)}.csv` };
}
