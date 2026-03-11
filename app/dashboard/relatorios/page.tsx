import { createClient } from "@/lib/supabase/server";
import { RelatoriosTabs } from "./RelatoriosTabs";
import { RelatorioMensalContent } from "./RelatorioMensalContent";
import type { MonthlyReportData } from "./RelatorioMensalContent";
import { RelatorioAnualContent } from "./RelatorioAnualContent";
import type { AnnualReportData } from "./RelatorioAnualContent";
import { ExportPdfButton } from "@/components/reports/ExportPdfButton";
import { getRelatorioMensalPdf, getRelatorioAnualPdf } from "@/actions/reports-pdf";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function getMonthBounds(year: number, month: number) {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0, 23, 59, 59, 999);
  return { first, last };
}

export default async function RelatoriosPage(props: {
  searchParams: Promise<{ tab?: string; mes?: string; ano?: string }>;
}) {
  const params = await props.searchParams;
  const tab = (params.tab === "anual" ? "anual" : "mensal") as "mensal" | "anual";
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  let year = currentYear;
  let month = currentMonth;
  if (/^\d{4}-\d{2}$/.test(params.mes ?? "")) {
    const [y, m] = (params.mes ?? "").split("-").map(Number);
    if (m >= 1 && m <= 12) {
      year = y;
      month = m;
    }
  }
  const anoParam = params.ano ? parseInt(params.ano, 10) : currentYear;
  const ano = Number.isFinite(anoParam) && anoParam >= 2000 && anoParam <= 2100 ? anoParam : currentYear;

  const supabase = await createClient();

  if (tab === "mensal") {
    const { first: firstDay, last: lastDay } = getMonthBounds(year, month);
    const yearMonth = `${year}-${String(month).padStart(2, "0")}`;
    const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

    const [
      { data: sellsData },
      { data: purchasesData },
      { data: prevClosingData },
    ] = await Promise.all([
      supabase
        .from("sells")
        .select("id, data, total_value, clients(name)")
        .eq("status", "CONCLUIDA")
        .gte("data", firstDay.toISOString())
        .lte("data", lastDay.toISOString())
        .order("data", { ascending: true }),
      supabase
        .from("purchases")
        .select("id, purchase_date, total_value, supplier")
        .eq("status", "RECEBIDA")
        .gte("purchase_date", firstDay.toISOString().slice(0, 10))
        .lte("purchase_date", lastDay.toISOString().slice(0, 10))
        .order("purchase_date", { ascending: true }),
      supabase
        .from("monthly_closings")
        .select("saldo_resultante")
        .eq("year", month === 1 ? year - 1 : year)
        .eq("month", month === 1 ? 12 : month - 1)
        .single(),
    ]);

    const sells = (sellsData ?? []) as { id: number; data: string; total_value: number; clients?: { name: string } | null }[];
    const purchases = (purchasesData ?? []) as { id: number; purchase_date: string; total_value: number; supplier: string }[];
    const prevClosing = prevClosingData as { saldo_resultante: number } | null;
    const saldoDoMesAnterior = prevClosing != null ? Number(prevClosing.saldo_resultante) : 0;

    const totalEntradas = sells.reduce((acc, s) => acc + Number(s.total_value), 0);
    const totalSaidas = purchases.reduce((acc, p) => acc + Number(p.total_value), 0);
    const saldoResultante = totalEntradas - totalSaidas;
    const saldoEmCaixa = saldoDoMesAnterior + saldoResultante;

    const prevBounds = month === 1 ? getMonthBounds(year - 1, 12) : getMonthBounds(year, month - 1);
    const { data: prevMonthSellsData } = await supabase
      .from("sells")
      .select("total_value")
      .eq("status", "CONCLUIDA")
      .gte("data", prevBounds.first.toISOString())
      .lte("data", prevBounds.last.toISOString());
    const { data: prevMonthPurchasesData } = await supabase
      .from("purchases")
      .select("total_value")
      .eq("status", "RECEBIDA")
      .gte("purchase_date", prevBounds.first.toISOString().slice(0, 10))
      .lte("purchase_date", prevBounds.last.toISOString().slice(0, 10));
    const prevEntradas = (prevMonthSellsData ?? []).reduce((a: number, s: { total_value: number }) => a + Number(s.total_value), 0);
    const prevSaidas = (prevMonthPurchasesData ?? []).reduce((a: number, p: { total_value: number }) => a + Number(p.total_value), 0);
    const prevSaldo = prevEntradas - prevSaidas;
    const variacaoValor = saldoResultante - prevSaldo;
    const variacaoPercentual = prevSaldo !== 0 ? (variacaoValor / Math.abs(prevSaldo)) * 100 : 0;

    const transacoes: MonthlyReportData["transacoes"] = [];
    for (const s of sells) {
      const d = new Date(s.data);
      transacoes.push({
        date: d.toLocaleDateString("pt-BR"),
        description: `Venda #${s.id}`,
        category: "Vendas",
        member: s.clients?.name ?? "—",
        type: "Entrada",
        value: Number(s.total_value),
      });
    }
    for (const p of purchases) {
      transacoes.push({
        date: new Date(p.purchase_date).toLocaleDateString("pt-BR"),
        description: p.supplier || `Compra #${p.id}`,
        category: "Compras",
        member: "—",
        type: "Saída",
        value: Number(p.total_value),
      });
    }
    transacoes.sort((a, b) => new Date(a.date.split("/").reverse().join("-")).getTime() - new Date(b.date.split("/").reverse().join("-")).getTime());

    const monthlyData: MonthlyReportData = {
      yearMonth,
      monthLabel,
      totalEntradas,
      totalSaidas,
      saldoResultante,
      saldoEmCaixa,
      variacaoValor,
      variacaoPercentual,
      chartData: [{ mes: MONTH_NAMES[month - 1], entradas: totalEntradas, saidas: totalSaidas }],
      transacoes,
    };

    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-bmq-dark mb-2">Relatórios</h1>
        <p className="text-bmq-mid-dark mb-4">Visão financeira e operacional por período.</p>
        <RelatoriosTabs currentTab="mensal" searchParams={{ tab: "mensal", mes: yearMonth }} />
        <div className="flex justify-end mb-6">
          <ExportPdfButton exportAction={getRelatorioMensalPdf} exportParams={{ mes: yearMonth }} label="Exportar PDF" />
        </div>
        <RelatorioMensalContent data={monthlyData} />
      </div>
    );
  }

  // tab === "anual"
  const firstDayOfYear = new Date(ano, 0, 1);
  const lastDayOfYear = new Date(ano, 11, 31, 23, 59, 59, 999);

  const [
    { data: sellsYearData },
    { data: purchasesYearData },
    { data: sellsPrevYearData },
    { data: purchasesPrevYearData },
  ] = await Promise.all([
    supabase
      .from("sells")
      .select("data, total_value")
      .eq("status", "CONCLUIDA")
      .gte("data", firstDayOfYear.toISOString())
      .lte("data", lastDayOfYear.toISOString()),
    supabase
      .from("purchases")
      .select("purchase_date, total_value")
      .eq("status", "RECEBIDA")
      .gte("purchase_date", firstDayOfYear.toISOString().slice(0, 10))
      .lte("purchase_date", lastDayOfYear.toISOString().slice(0, 10)),
    supabase
      .from("sells")
      .select("data, total_value")
      .eq("status", "CONCLUIDA")
      .gte("data", new Date(ano - 1, 0, 1).toISOString())
      .lte("data", new Date(ano - 1, 11, 31, 23, 59, 59).toISOString()),
    supabase
      .from("purchases")
      .select("purchase_date, total_value")
      .eq("status", "RECEBIDA")
      .gte("purchase_date", `${ano - 1}-01-01`)
      .lte("purchase_date", `${ano - 1}-12-31`),
  ]);

  const sellsYear = (sellsYearData ?? []) as { data: string; total_value: number }[];
  const purchasesYear = (purchasesYearData ?? []) as { purchase_date: string; total_value: number }[];
  const sellsPrev = (sellsPrevYearData ?? []) as { data: string; total_value: number }[];
  const purchasesPrev = (purchasesPrevYearData ?? []) as { purchase_date: string; total_value: number }[];

  const byMonthEntradas: Record<number, number> = {};
  const byMonthSaidas: Record<number, number> = {};
  for (let m = 1; m <= 12; m++) {
    byMonthEntradas[m] = 0;
    byMonthSaidas[m] = 0;
  }
  for (const s of sellsYear) {
    const m = new Date(s.data).getMonth() + 1;
    byMonthEntradas[m] = (byMonthEntradas[m] ?? 0) + Number(s.total_value);
  }
  for (const p of purchasesYear) {
    const m = new Date(p.purchase_date).getMonth() + 1;
    byMonthSaidas[m] = (byMonthSaidas[m] ?? 0) + Number(p.total_value);
  }

  const totalEntradas = Object.values(byMonthEntradas).reduce((a, b) => a + b, 0);
  const totalSaidas = Object.values(byMonthSaidas).reduce((a, b) => a + b, 0);
  const saldoAnual = totalEntradas - totalSaidas;

  const prevYearEntradas = sellsPrev.reduce((a, s) => a + Number(s.total_value), 0);
  const prevYearSaidas = purchasesPrev.reduce((a, p) => a + Number(p.total_value), 0);
  const prevYearSaldo = prevYearEntradas - prevYearSaidas;
  const variacaoValor = saldoAnual - prevYearSaldo;
  const variacaoPercentual = prevYearSaldo !== 0 ? (variacaoValor / Math.abs(prevYearSaldo)) * 100 : 0;

  const monthlyLine: AnnualReportData["monthlyLine"] = [];
  const monthlyBar: AnnualReportData["monthlyBar"] = [];
  for (let m = 1; m <= 12; m++) {
    const entradas = byMonthEntradas[m] ?? 0;
    const saidas = byMonthSaidas[m] ?? 0;
    const saldo = entradas - saidas;
    const mesLabel = MONTH_NAMES[m - 1];
    monthlyLine.push({ mes: mesLabel, entradas, saidas, saldo });
    monthlyBar.push({ mes: mesLabel, entradas, saidas });
  }

  const annualData: AnnualReportData = {
    year: ano,
    totalEntradas,
    totalSaidas,
    saldoAnual,
    variacaoValor,
    variacaoPercentual,
    monthlyLine,
    monthlyBar,
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-bmq-dark mb-2">Relatórios</h1>
      <p className="text-bmq-mid-dark mb-4">Visão financeira e operacional por período.</p>
      <RelatoriosTabs currentTab="anual" searchParams={{ tab: "anual", ano: String(ano) }} />
      <div className="flex justify-end mb-6">
        <ExportPdfButton exportAction={getRelatorioAnualPdf} exportParams={{ ano: String(ano) }} label="Exportar PDF" />
      </div>
      <RelatorioAnualContent data={annualData} />
    </div>
  );
}
