"use server";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { createClient } from "@/lib/supabase/server";
import type { MovementReason, MovementType } from "@/types/database";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function addHeader(doc: jsPDF, title: string): void {
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(10);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, 28);
}

/** Retorna o PDF em base64 (jsPDF.output aceita "base64" em runtime; a tipagem pode restringir). */
function getPdfBase64(doc: jsPDF): string {
  return (doc.output as (format: string) => string)("base64");
}

/**
 * PDF do Relatório Mensal (resumo + transações).
 */
export async function getRelatorioMensalPdf(params: { mes: string }): Promise<{ pdfBase64: string; filename: string }> {
  const [year, month] = (params.mes ?? "").split("-").map(Number);
  if (!year || !month || month < 1 || month > 12) {
    const doc = new jsPDF();
    doc.text("Mês inválido.", 14, 20);
    return { pdfBase64: getPdfBase64(doc), filename: `relatorio-mensal-${params.mes || "invalido"}.pdf` };
  }
  const first = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0, 23, 59, 59, 999);
  const supabase = await createClient();

  const [
    { data: sellsData },
    { data: purchasesData },
    { data: prevClosingData },
  ] = await Promise.all([
    supabase.from("sells").select("id, data, total_value, clients(name)").eq("status", "CONCLUIDA")
      .gte("data", first.toISOString()).lte("data", lastDay.toISOString()).order("data", { ascending: true }),
    supabase.from("purchases").select("id, purchase_date, total_value, supplier").eq("status", "RECEBIDA")
      .gte("purchase_date", first.toISOString().slice(0, 10)).lte("purchase_date", lastDay.toISOString().slice(0, 10)).order("purchase_date", { ascending: true }),
    supabase.from("monthly_closings").select("saldo_resultante")
      .eq("year", month === 1 ? year - 1 : year).eq("month", month === 1 ? 12 : month - 1).single(),
  ]);

  const sells = (sellsData ?? []) as { id: number; data: string; total_value: number; clients?: { name: string } | null }[];
  const purchases = (purchasesData ?? []) as { id: number; purchase_date: string; total_value: number; supplier: string }[];
  const prevClosing = prevClosingData as { saldo_resultante: number } | null;
  const saldoDoMesAnterior = prevClosing != null ? Number(prevClosing.saldo_resultante) : 0;
  const totalEntradas = sells.reduce((acc, s) => acc + Number(s.total_value), 0);
  const totalSaidas = purchases.reduce((acc, p) => acc + Number(p.total_value), 0);
  const saldoResultante = totalEntradas - totalSaidas;
  const saldoEmCaixa = saldoDoMesAnterior + saldoResultante;
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  const doc = new jsPDF();
  addHeader(doc, `Relatório Mensal - ${monthLabel}`);
  let y = 36;
  doc.setFontSize(11);
  doc.text(`Total Entradas: R$ ${formatCurrency(totalEntradas)}`, 14, y); y += 7;
  doc.text(`Total Saídas: R$ ${formatCurrency(totalSaidas)}`, 14, y); y += 7;
  doc.text(`Saldo Resultante: R$ ${formatCurrency(saldoResultante)}`, 14, y); y += 7;
  doc.text(`Saldo em Caixa: R$ ${formatCurrency(saldoEmCaixa)}`, 14, y); y += 10;

  const transacoes: string[][] = [];
  for (const s of sells) {
    transacoes.push([
      new Date(s.data).toLocaleDateString("pt-BR"),
      `Venda #${s.id}`,
      "Entrada",
      s.clients?.name ?? "—",
      `R$ ${formatCurrency(Number(s.total_value))}`,
    ]);
  }
  for (const p of purchases) {
    transacoes.push([
      new Date(p.purchase_date).toLocaleDateString("pt-BR"),
      p.supplier || `Compra #${p.id}`,
      "Saída",
      "—",
      `R$ ${formatCurrency(Number(p.total_value))}`,
    ]);
  }
  transacoes.sort((a, b) => new Date(a[0].split("/").reverse().join("-")).getTime() - new Date(b[0].split("/").reverse().join("-")).getTime());

  if (transacoes.length) {
    autoTable(doc, {
      startY: y,
      head: [["Data", "Descrição", "Tipo", "Membro", "Valor"]],
      body: transacoes,
      theme: "grid",
      headStyles: { fillColor: [34, 139, 34] },
    });
  }
  return { pdfBase64: getPdfBase64(doc), filename: `relatorio-mensal-${params.mes}.pdf` };
}

/**
 * PDF do Relatório Anual (resumo + quadro por mês).
 */
export async function getRelatorioAnualPdf(params: { ano: string }): Promise<{ pdfBase64: string; filename: string }> {
  const ano = Number(params.ano);
  if (!Number.isFinite(ano) || ano < 2000 || ano > 2100) {
    const doc = new jsPDF();
    doc.text("Ano inválido.", 14, 20);
    return { pdfBase64: getPdfBase64(doc), filename: `relatorio-anual-${params.ano || "invalido"}.pdf` };
  }
  const supabase = await createClient();
  const firstDay = new Date(ano, 0, 1);
  const lastDay = new Date(ano, 11, 31, 23, 59, 59, 999);

  const [
    { data: sellsData },
    { data: purchasesData },
  ] = await Promise.all([
    supabase.from("sells").select("data, total_value").eq("status", "CONCLUIDA")
      .gte("data", firstDay.toISOString()).lte("data", lastDay.toISOString()),
    supabase.from("purchases").select("purchase_date, total_value").eq("status", "RECEBIDA")
      .gte("purchase_date", firstDay.toISOString().slice(0, 10)).lte("purchase_date", lastDay.toISOString().slice(0, 10)),
  ]);

  const sells = (sellsData ?? []) as { data: string; total_value: number }[];
  const purchases = (purchasesData ?? []) as { purchase_date: string; total_value: number }[];
  const byMonthEntradas: Record<number, number> = {};
  const byMonthSaidas: Record<number, number> = {};
  for (let m = 1; m <= 12; m++) {
    byMonthEntradas[m] = 0;
    byMonthSaidas[m] = 0;
  }
  for (const s of sells) {
    const m = new Date(s.data).getMonth() + 1;
    byMonthEntradas[m] = (byMonthEntradas[m] ?? 0) + Number(s.total_value);
  }
  for (const p of purchases) {
    const m = new Date(p.purchase_date).getMonth() + 1;
    byMonthSaidas[m] = (byMonthSaidas[m] ?? 0) + Number(p.total_value);
  }
  const totalEntradas = Object.values(byMonthEntradas).reduce((a, b) => a + b, 0);
  const totalSaidas = Object.values(byMonthSaidas).reduce((a, b) => a + b, 0);
  const saldoAnual = totalEntradas - totalSaidas;

  const doc = new jsPDF();
  addHeader(doc, `Relatório Anual ${ano}`);
  let y = 36;
  doc.setFontSize(11);
  doc.text(`Total Entradas: R$ ${formatCurrency(totalEntradas)}`, 14, y); y += 7;
  doc.text(`Total Saídas: R$ ${formatCurrency(totalSaidas)}`, 14, y); y += 7;
  doc.text(`Saldo Anual: R$ ${formatCurrency(saldoAnual)}`, 14, y); y += 10;

  const body = MONTH_NAMES.map((mes, i) => {
    const m = i + 1;
    const e = byMonthEntradas[m] ?? 0;
    const s = byMonthSaidas[m] ?? 0;
    return [mes, `R$ ${formatCurrency(e)}`, `R$ ${formatCurrency(s)}`, `R$ ${formatCurrency(e - s)}`];
  });
  autoTable(doc, {
    startY: y,
    head: [["Mês", "Entradas", "Saídas", "Saldo"]],
    body,
    theme: "grid",
    headStyles: { fillColor: [34, 139, 34] },
  });
  return { pdfBase64: getPdfBase64(doc), filename: `relatorio-anual-${ano}.pdf` };
}

/**
 * PDF do relatório Estoque Atual (mesmos filtros do CSV).
 */
export async function getEstoqueAtualPdf(params: {
  busca?: string;
  categoria?: string;
  marca?: string;
  status?: string;
  validade?: string;
}): Promise<{ pdfBase64: string; filename: string }> {
  const supabase = await createClient();
  const [locationsRes, { data }] = await Promise.all([
    supabase.from("locations").select("id, name").order("name"),
    supabase.from("stock").select("*, products(title, brand_id, category_id, brands(name), categories(name))").order("product_id"),
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
    products?: { title: string; brands?: { name: string } | null; categories?: { name: string } | null } | null;
  }[];
  const busca = (params.busca ?? "").trim().toLowerCase();
  if (busca) {
    rows = rows.filter((s) => {
      const title = s.products?.title?.toLowerCase() ?? "";
      const locName = locationsMap.get(s.location_id ?? 0) ?? s.location ?? "";
      const loc = locName.toLowerCase();
      return title.includes(busca) || loc.includes(busca);
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
    const in30 = new Date(today); in30.setDate(in30.getDate() + 30);
    rows = rows.filter((s) => s.expiry_date && new Date(s.expiry_date) >= today && new Date(s.expiry_date) <= in30);
  } else if (params.validade === "valido") {
    const in30 = new Date(today); in30.setDate(in30.getDate() + 30);
    rows = rows.filter((s) => !s.expiry_date || new Date(s.expiry_date) > in30);
  }

  const body = rows.map((s) => {
    const totalValue = s.quantity * Number(s.cost_price);
    let status = "OK";
    if (s.quantity === 0) status = "Sem estoque";
    else if (s.min_quantity > 0 && s.quantity <= s.min_quantity) status = "Estoque baixo";
    const validity = s.expiry_date ? new Date(s.expiry_date).toLocaleDateString("pt-BR") : "—";
    const locationName = (s.location_id != null ? locationsMap.get(s.location_id) : null) ?? s.location ?? "—";
    return [
      s.products?.title ?? "—",
      s.products?.brands?.name ?? "—",
      s.products?.categories?.name ?? "—",
      String(s.quantity),
      String(s.min_quantity),
      locationName,
      `R$ ${Number(s.cost_price).toFixed(2)}`,
      `R$ ${totalValue.toFixed(2)}`,
      status,
      validity,
    ];
  });

  const doc = new jsPDF({ orientation: "landscape" });
  addHeader(doc, "Relatório Estoque Atual");
  autoTable(doc, {
    startY: 32,
    head: [["Produto", "Marca", "Categoria", "Qtd", "Min", "Local", "Custo", "Valor total", "Status", "Validade"]],
    body,
    theme: "grid",
    headStyles: { fillColor: [34, 139, 34] },
    styles: { fontSize: 8 },
  });
  return { pdfBase64: getPdfBase64(doc), filename: `estoque-atual-${new Date().toISOString().slice(0, 10)}.pdf` };
}

/**
 * PDF do relatório Movimentações (mesmos filtros do CSV).
 */
export async function getMovimentacoesPdf(params: {
  tipo?: string;
  motivo?: string;
  produto?: string;
  data_inicio?: string;
  data_fim?: string;
}): Promise<{ pdfBase64: string; filename: string }> {
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

  const body = rows.map((m) => {
    const after = m.quantity_before != null ? m.quantity_before + m.quantity : "—";
    return [
      new Date(m.created_at).toLocaleString("pt-BR"),
      m.stock?.products?.title ?? "—",
      m.movement_type,
      m.reason,
      String(m.quantity),
      String(m.quantity_before ?? "—"),
      String(after),
      (m.notes ?? "").slice(0, 30),
    ];
  });

  const doc = new jsPDF();
  addHeader(doc, "Relatório Movimentações");
  autoTable(doc, {
    startY: 32,
    head: [["Data", "Produto", "Tipo", "Motivo", "Qtd", "Antes", "Depois", "Obs."]],
    body,
    theme: "grid",
    headStyles: { fillColor: [34, 139, 34] },
    styles: { fontSize: 8 },
  });
  return { pdfBase64: getPdfBase64(doc), filename: `movimentacoes-${new Date().toISOString().slice(0, 10)}.pdf` };
}

/**
 * PDF do relatório Estoque Baixo.
 */
export async function getEstoqueBaixoPdf(): Promise<{ pdfBase64: string; filename: string }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stock")
    .select("*, products(title, brands(name), categories(name))")
    .order("product_id");
  const all = (data ?? []) as { quantity: number; min_quantity: number; cost_price: number; products?: { title: string; brands?: { name: string }; categories?: { name: string } } | null }[];
  const rows = all.filter((s) => s.min_quantity > 0 && s.quantity <= s.min_quantity && s.quantity >= 0);

  const body = rows.map((s) => {
    const sug = Math.max(0, s.min_quantity - s.quantity);
    return [
      s.products?.title ?? "—",
      s.products?.brands?.name ?? "—",
      s.products?.categories?.name ?? "—",
      String(s.quantity),
      String(s.min_quantity),
      String(sug),
      `R$ ${Number(s.cost_price).toFixed(2)}`,
    ];
  });

  const doc = new jsPDF();
  addHeader(doc, "Relatório Estoque Baixo");
  autoTable(doc, {
    startY: 32,
    head: [["Produto", "Marca", "Categoria", "Qtd", "Mínimo", "Sugestão compra", "Preço custo"]],
    body,
    theme: "grid",
    headStyles: { fillColor: [34, 139, 34] },
  });
  return { pdfBase64: getPdfBase64(doc), filename: `estoque-baixo-${new Date().toISOString().slice(0, 10)}.pdf` };
}

/**
 * PDF do relatório Valor de Estoque (por categoria, por marca, total).
 */
export async function getValorEstoquePdf(): Promise<{ pdfBase64: string; filename: string }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stock")
    .select("quantity, cost_price, products(categories(name), brands(name))");
  const all = (data ?? []) as { quantity: number; cost_price: number; products?: { categories?: { name: string } | null; brands?: { name: string } | null } | null }[];
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

  const doc = new jsPDF();
  addHeader(doc, "Relatório Valor de Estoque");
  let y = 32;
  doc.setFontSize(11);
  doc.text(`Total: ${totalProdutos} produtos, ${totalQty} unidades, R$ ${formatCurrency(totalValor)}`, 14, y);
  y += 10;

  const catBody = Object.entries(byCategory).sort((a, b) => b[1].valor - a[1].valor).map(([name, v]) => [name, String(v.produtos), String(v.quantidade), `R$ ${v.valor.toFixed(2)}`]);
  autoTable(doc, {
    startY: y,
    head: [["Categoria", "Produtos", "Qtd", "Valor (R$)"]],
    body: catBody,
    theme: "grid",
    headStyles: { fillColor: [34, 139, 34] },
  });
  y = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y + 10;
  y += 8;
  doc.setFontSize(12);
  doc.text("Por marca", 14, y); y += 7;
  const brandBody = Object.entries(byBrand).sort((a, b) => b[1].valor - a[1].valor).map(([name, v]) => [name, String(v.produtos), String(v.quantidade), `R$ ${v.valor.toFixed(2)}`]);
  autoTable(doc, {
    startY: y,
    head: [["Marca", "Produtos", "Qtd", "Valor (R$)"]],
    body: brandBody,
    theme: "grid",
    headStyles: { fillColor: [34, 139, 34] },
  });
  return { pdfBase64: getPdfBase64(doc), filename: `valor-estoque-${new Date().toISOString().slice(0, 10)}.pdf` };
}
