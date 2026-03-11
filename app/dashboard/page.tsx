import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardCharts } from "./DashboardCharts";
import { MonthPicker } from "@/components/dashboard/MonthPicker";
import { FinalizarMesButton } from "./FinalizarMesButton";
import type { SalesSeries, DailySeries } from "./DashboardCharts";

function getMonthBounds(year: number, month: number) {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0, 23, 59, 59, 999);
  return { first, last };
}

export default async function DashboardPage(props: { searchParams: Promise<{ mes?: string }> }) {
  const searchParams = await props.searchParams;
  const mesParam = searchParams.mes ?? "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let year = today.getFullYear();
  let month = today.getMonth() + 1;
  if (/^\d{4}-\d{2}$/.test(mesParam)) {
    const [y, m] = mesParam.split("-").map(Number);
    if (m >= 1 && m <= 12) {
      year = y;
      month = m;
    }
  }
  const yearMonth = `${year}-${String(month).padStart(2, "0")}`;
  const { first: firstDayOfMonth, last: lastDayOfMonth } = getMonthBounds(year, month);

  const supabase = await createClient();
  const [
    { data: stockData },
    { data: sellsData },
    { data: purchasesData },
    { data: movementsData },
  ] = await Promise.all([
    supabase.from("stock").select("id, product_id, quantity, min_quantity, cost_price, expiry_date, products(title, category_id, categories(name))"),
    supabase.from("sells").select("data, total_value").eq("status", "CONCLUIDA"),
    supabase.from("purchases").select("purchase_date, total_value").eq("status", "RECEBIDA"),
    supabase.from("stock_movements").select("movement_type, quantity, created_at"),
  ]);

  const stocks = (stockData ?? []) as {
    id: number;
    product_id: number;
    quantity: number;
    min_quantity: number;
    cost_price: number;
    expiry_date: string | null;
    products?: { title: string; category_id: number; categories?: { name: string } | null } | null;
  }[];
  const allSells = (sellsData ?? []) as { data: string; total_value: number }[];
  const allPurchases = (purchasesData ?? []) as { purchase_date: string; total_value: number }[];
  const allMovements = (movementsData ?? []) as { movement_type: string; quantity: number; created_at: string }[];

  const sells = allSells.filter((s) => {
    const d = new Date(s.data);
    return d >= firstDayOfMonth && d <= lastDayOfMonth;
  });
  const purchases = allPurchases.filter((p) => {
    const d = new Date(p.purchase_date);
    return d >= firstDayOfMonth && d <= lastDayOfMonth;
  });

  const receitasDoMes = sells.reduce((acc, s) => acc + Number(s.total_value), 0);
  const despesasDoMes = purchases.reduce((acc, p) => acc + Number(p.total_value), 0);
  const saldoResultante = receitasDoMes - despesasDoMes;

  const prevBounds = month === 1 ? getMonthBounds(year - 1, 12) : getMonthBounds(year, month - 1);
  const { data: prevClosing } = await supabase
    .from("monthly_closings")
    .select("saldo_resultante")
    .eq("year", prevBounds.first.getFullYear())
    .eq("month", prevBounds.first.getMonth() + 1)
    .single();

  const saldoDoMesAnterior =
    prevClosing != null
      ? Number(prevClosing.saldo_resultante)
      : (() => {
          const prevSells = allSells.filter((s) => {
            const d = new Date(s.data);
            return d >= prevBounds.first && d <= prevBounds.last;
          });
          const prevPurchases = allPurchases.filter((p) => {
            const d = new Date(p.purchase_date);
            return d >= prevBounds.first && d <= prevBounds.last;
          });
          return prevSells.reduce((acc, s) => acc + Number(s.total_value), 0) - prevPurchases.reduce((acc, p) => acc + Number(p.total_value), 0);
        })();

  /** Saldo atual = saldo do mês anterior + saldo resultante do mês; atualiza junto com receitas/despesas. */
  const saldoAtual = saldoDoMesAnterior + saldoResultante;

  const { data: currentClosing } = await supabase
    .from("monthly_closings")
    .select("id")
    .eq("year", year)
    .eq("month", month)
    .single();
  const mesJaFinalizado = currentClosing != null;

  // Agregação por produto: mesmo produto pode ter estoque em vários locais; total = soma.
  const byProduct = new Map<number, { quantity: number; value: number; min_quantity: number; expiry_date: string | null }>();
  for (const s of stocks) {
    const cur = byProduct.get(s.product_id);
    const qty = s.quantity;
    const val = qty * Number(s.cost_price);
    if (!cur) {
      byProduct.set(s.product_id, { quantity: qty, value: val, min_quantity: s.min_quantity, expiry_date: s.expiry_date });
    } else {
      cur.quantity += qty;
      cur.value += val;
      cur.min_quantity = Math.max(cur.min_quantity, s.min_quantity);
      if (s.expiry_date && (!cur.expiry_date || new Date(s.expiry_date) < new Date(cur.expiry_date))) cur.expiry_date = s.expiry_date;
    }
  }
  const totalProdutos = byProduct.size;
  const productValues = Array.from(byProduct.values());
  const valorTotal = productValues.reduce((acc, p) => acc + p.value, 0);
  const semEstoque = productValues.filter((p) => p.quantity === 0).length;
  const estoqueBaixo = productValues.filter((p) => p.min_quantity > 0 && p.quantity > 0 && p.quantity <= p.min_quantity).length;
  const vencidos = productValues.filter((p) => p.expiry_date && new Date(p.expiry_date) < today).length;
  const proximosVencimento = productValues.filter((p) => {
    if (!p.expiry_date) return false;
    const exp = new Date(p.expiry_date);
    const in30 = new Date(today);
    in30.setDate(in30.getDate() + 30);
    return exp >= today && exp <= in30;
  }).length;

  const sellsFiltered = sells;
  const byDay: Record<string, { total: number; count: number }> = {};
  const byWeek: Record<string, { total: number; count: number }> = {};
  const byMonth: Record<string, { total: number; count: number }> = {};
  for (const s of sellsFiltered) {
    const d = new Date(s.data);
    const dayKey = d.toISOString().slice(0, 10);
    const weekKey = getWeekKey(d);
    const monthKey = d.toISOString().slice(0, 7);
    byDay[dayKey] = byDay[dayKey] ?? { total: 0, count: 0 };
    byDay[dayKey].total += Number(s.total_value);
    byDay[dayKey].count += 1;
    byWeek[weekKey] = byWeek[weekKey] ?? { total: 0, count: 0 };
    byWeek[weekKey].total += Number(s.total_value);
    byWeek[weekKey].count += 1;
    byMonth[monthKey] = byMonth[monthKey] ?? { total: 0, count: 0 };
    byMonth[monthKey].total += Number(s.total_value);
    byMonth[monthKey].count += 1;
  }
  const salesDaily: SalesSeries[] = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([period, v]) => ({ period: new Date(period).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), ...v }));
  const salesWeekly: SalesSeries[] = Object.entries(byWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([period, v]) => ({ period: `Sem ${period}`, ...v }));
  const salesMonthly: SalesSeries[] = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([period, v]) => {
      const d = new Date(period + "-01");
      const m = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").trim();
      const label = `${m.charAt(0).toUpperCase() + m.slice(1)}/${d.getFullYear().toString().slice(-2)}`;
      return { period: label, ...v };
    });

  // Receitas e despesas por dia do mês (um ponto por dia para o gráfico)
  const daysInMonth = lastDayOfMonth.getDate();
  const receitasByDay: Record<string, number> = {};
  const despesasByDay: Record<string, number> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const key = date.toISOString().slice(0, 10);
    receitasByDay[key] = 0;
    despesasByDay[key] = 0;
  }
  for (const s of sells) {
    const key = new Date(s.data).toISOString().slice(0, 10);
    if (receitasByDay[key] !== undefined) receitasByDay[key] += Number(s.total_value);
  }
  for (const p of purchases) {
    const key = new Date(p.purchase_date).toISOString().slice(0, 10);
    if (despesasByDay[key] !== undefined) despesasByDay[key] += Number(p.total_value);
  }
  const receitasPorDia: DailySeries[] = Object.entries(receitasByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateStr, total]) => ({
      period: new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      total,
    }));
  const despesasPorDia: DailySeries[] = Object.entries(despesasByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateStr, total]) => ({
      period: new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      total,
    }));

  const { data: recentSells } = await supabase
    .from("sells")
    .select("id, data, total_value, status, clients(name)")
    .gte("data", firstDayOfMonth.toISOString())
    .lte("data", lastDayOfMonth.toISOString())
    .order("data", { ascending: false })
    .limit(10);
  const { data: recentMovements } = await supabase
    .from("stock_movements")
    .select("id, movement_type, quantity, reference, created_at, stock(products(title))")
    .gte("created_at", firstDayOfMonth.toISOString())
    .lte("created_at", lastDayOfMonth.toISOString())
    .order("created_at", { ascending: false })
    .limit(15);

  const productIdToTitle = new Map(stocks.map((s) => [s.product_id, s.products?.title ?? null]));
  const productEntries = Array.from(byProduct.entries());
  const alertasSemEstoque = productEntries
    .filter(([_, p]) => p.quantity === 0)
    .slice(0, 5)
    .map(([pid]) => ({ product_id: pid, products: { title: productIdToTitle.get(pid) } }));
  const alertasBaixo = productEntries
    .filter(([_, p]) => p.min_quantity > 0 && p.quantity > 0 && p.quantity <= p.min_quantity)
    .slice(0, 5)
    .map(([pid]) => ({ product_id: pid, products: { title: productIdToTitle.get(pid) } }));
  const alertasVencidos = productEntries
    .filter(([_, p]) => p.expiry_date && new Date(p.expiry_date) < today)
    .slice(0, 5)
    .map(([pid]) => ({ product_id: pid, products: { title: productIdToTitle.get(pid) } }));
  const alertasProximos = productEntries
    .filter(([_, p]) => {
      if (!p.expiry_date) return false;
      const exp = new Date(p.expiry_date);
      const in30 = new Date(today);
      in30.setDate(in30.getDate() + 30);
      return exp >= today && exp <= in30;
    })
    .slice(0, 5)
    .map(([pid]) => ({ product_id: pid, products: { title: productIdToTitle.get(pid) } }));
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const movimentacoesGrandes = allMovements.filter((m) => Math.abs(m.quantity) >= 20 && new Date(m.created_at) >= last24h).length;

  const todayDate = new Date();
  const isCurrentOrPastMonth =
    year < todayDate.getFullYear() || (year === todayDate.getFullYear() && month <= todayDate.getMonth() + 1);

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-bmq-dark">Dashboard</h1>
        <MonthPicker yearMonth={yearMonth} allowFutureMonths={false} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Saldo Atual"
          value={`R$ ${saldoAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          className={saldoAtual >= 0 ? "text-bmq-dark" : "text-red-600"}
          animationDelay="delay-0"
        />
        <div className="rounded-card border border-bmq-border bg-white shadow-card p-4 transition-all duration-300 ease-out hover:scale-[1.015] hover:shadow-cardHover animate-fade-slide-up delay-75" style={{ backgroundColor: "var(--bmq-cardBg, #FFFFFF)" }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-bmq-dark uppercase tracking-wide">Saldo Resultante</p>
              <p className={`mt-1 text-xl font-semibold ${saldoResultante >= 0 ? "text-bmq-dark" : "text-red-600"}`}>
                R$ {saldoResultante.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <FinalizarMesButton
              year={year}
              month={month}
              saldoResultante={saldoResultante}
              disabled={mesJaFinalizado || !isCurrentOrPastMonth}
            />
          </div>
        </div>
        <MetricCard
          title="Receitas do Mês"
          value={`R$ ${receitasDoMes.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          className="text-bmq-dark"
          animationDelay="delay-150"
        />
        <MetricCard
          title="Despesas do Mês"
          value={`R$ ${despesasDoMes.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          className="text-red-600"
          animationDelay="delay-200"
        />
      </div>

      <section className="rounded-card border border-bmq-border bg-white shadow-card p-4 transition-all duration-300 ease-out hover:scale-[1.015] hover:shadow-cardHover" style={{ backgroundColor: "var(--bmq-cardBg, #FFFFFF)" }}>
        <h2 className="text-lg font-semibold text-bmq-dark mb-3">Alertas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          {semEstoque > 0 && (
            <div>
              <span className="font-medium text-red-700">Sem estoque ({semEstoque})</span>
              <ul className="mt-1 text-bmq-mid-dark">
                {alertasSemEstoque.map((s, i) => (
                  <li key={i}>{s.products?.title ?? `Produto #${s.product_id}`}</li>
                ))}
                {semEstoque > 5 && <li>… e mais {semEstoque - 5}</li>}
              </ul>
            </div>
          )}
          {estoqueBaixo > 0 && (
            <div>
              <span className="font-medium text-amber-700">Estoque baixo ({estoqueBaixo})</span>
              <ul className="mt-1 text-bmq-mid-dark">
                {alertasBaixo.slice(0, 3).map((s, i) => (
                  <li key={i}>{s.products?.title ?? `Produto #${s.product_id}`}</li>
                ))}
              </ul>
            </div>
          )}
          {vencidos > 0 && (
            <div>
              <span className="font-medium text-red-700">Vencidos ({vencidos})</span>
              <ul className="mt-1 text-bmq-mid-dark list-disc list-inside">
                {alertasVencidos.slice(0, 3).map((s, i) => (
                  <li key={i}>{s.products?.title ?? `Produto #${s.product_id}`}</li>
                ))}
              </ul>
            </div>
          )}
          {proximosVencimento > 0 && (
            <div>
              <span className="font-medium text-amber-700">Próx. vencimento ({proximosVencimento})</span>
              <ul className="mt-1 text-bmq-mid-dark list-disc list-inside">
                {alertasProximos.slice(0, 3).map((s, i) => (
                  <li key={i}>{s.products?.title ?? `Produto #${s.product_id}`}</li>
                ))}
              </ul>
            </div>
          )}
          {movimentacoesGrandes > 0 && (
            <div>
              <span className="font-medium text-amber-700">Movimentações altas (24h)</span>
              <p className="text-bmq-mid-dark">{movimentacoesGrandes} movimentação(ões) com qtd ≥ 20</p>
            </div>
          )}
          {semEstoque === 0 && estoqueBaixo === 0 && vencidos === 0 && proximosVencimento === 0 && movimentacoesGrandes === 0 && (
            <p className="text-bmq-mid-dark">Nenhum alerta no momento.</p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-card border border-bmq-border bg-white shadow-card p-6 transition-all duration-300 ease-out hover:scale-[1.015] hover:shadow-cardHover" style={{ backgroundColor: "var(--bmq-cardBg, #FFFFFF)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-bmq-dark">Vendas recentes</h3>
            <Link href="/dashboard/vendas" className="text-sm text-bmq-mid-dark hover:underline">Ver todas</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-bmq-border text-left text-bmq-dark">
                  <th className="py-2">ID</th>
                  <th className="py-2">Cliente</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {((recentSells ?? []) as { id: number; data: string; total_value: number; clients?: { name: string } | null }[]).map((s) => (
                  <tr key={s.id} className="border-b border-bmq-border">
                    <td className="py-2 font-medium text-bmq-mid-dark">{s.id}</td>
                    <td className="py-2 text-bmq-mid-dark">{s.clients?.name ?? "—"}</td>
                    <td className="py-2 text-right text-bmq-dark">R$ {Number(s.total_value).toFixed(2)}</td>
                  </tr>
                ))}
                {(!recentSells || recentSells.length === 0) && (
                  <tr><td colSpan={3} className="py-4 text-center text-bmq-mid-dark">Nenhuma venda recente</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-card border border-bmq-border bg-white shadow-card p-6 transition-all duration-300 ease-out hover:scale-[1.015] hover:shadow-cardHover" style={{ backgroundColor: "var(--bmq-cardBg, #FFFFFF)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-bmq-dark">Movimentações recentes</h3>
            <Link href="/dashboard/movimentacoes" className="text-sm text-bmq-mid-dark hover:underline">Ver todas</Link>
          </div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-bmq-border text-left text-bmq-dark">
                  <th className="py-2">Tipo</th>
                  <th className="py-2">Qtd</th>
                  <th className="py-2">Ref.</th>
                </tr>
              </thead>
              <tbody>
                {((recentMovements ?? []) as { id: number; movement_type: string; quantity: number; reference: string | null; stock?: { products?: { title: string } | null } | null }[]).map((m) => (
                  <tr key={m.id} className="border-b border-bmq-border">
                    <td className="py-2 font-medium text-bmq-dark">{m.movement_type}</td>
                    <td className="py-2 text-bmq-dark">{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                    <td className="py-2 text-bmq-mid-dark truncate max-w-[120px]" title={m.reference ?? undefined}>{m.reference ?? "—"}</td>
                  </tr>
                ))}
                {(!recentMovements || recentMovements.length === 0) && (
                  <tr><td colSpan={3} className="py-4 text-center text-bmq-mid-dark">Nenhuma movimentação</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DashboardCharts
        salesDaily={salesDaily}
        salesWeekly={salesWeekly}
        salesMonthly={salesMonthly}
        receitasDoMes={receitasPorDia}
        despesasDoMes={despesasPorDia}
      />
    </div>
  );
}

function MetricCard({
  title,
  value,
  className = "",
  animationDelay = "delay-0",
}: {
  title: string;
  value: string;
  className?: string;
  animationDelay?: string;
}) {
  return (
    <div
      className={`rounded-card border border-bmq-border bg-white shadow-card p-4 transition-all duration-300 ease-out hover:scale-[1.015] hover:shadow-cardHover animate-fade-slide-up ${animationDelay}`}
      style={{ backgroundColor: "var(--bmq-cardBg, #FFFFFF)" }}
    >
      <p className="text-xs font-medium text-bmq-dark uppercase tracking-wide">{title}</p>
      <p className={`mt-1 text-xl font-semibold ${className || "text-bmq-dark"}`}>{value}</p>
    </div>
  );
}

function getWeekKey(d: Date): string {
  const start = new Date(d);
  start.setDate(start.getDate() - start.getDay());
  return start.toISOString().slice(0, 10);
}
