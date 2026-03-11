"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export type SalesSeries = { period: string; total: number; count: number };
export type CategoryStock = { name: string; count: number; value: number };
export type MovementByType = { type: string; count: number; quantity: number };
/** Série por dia do mês (receitas ou despesas). */
export type DailySeries = { period: string; total: number };

interface DashboardChartsProps {
  salesDaily: SalesSeries[];
  salesWeekly: SalesSeries[];
  salesMonthly: SalesSeries[];
  /** Receitas do mês por dia (para o gráfico "Receitas do mês"). */
  receitasDoMes: DailySeries[];
  /** Despesas do mês por dia (para o gráfico "Despesas do mês"). */
  despesasDoMes: DailySeries[];
}

export function DashboardCharts({
  salesDaily,
  salesWeekly,
  salesMonthly,
  receitasDoMes,
  despesasDoMes,
}: DashboardChartsProps) {
  const chartTextColor = "#374151";
  const chartLineColor = "#5e7f59";
  const gridStroke = "rgba(94, 127, 89, 0.15)";
  const barReceitas = "#5e7f59";
  const barDespesas = "#c62828";

  return (
    <div className="space-y-8">
      <div className="rounded-card border border-bmq-border bg-white shadow-card p-6 transition-all duration-300 ease-out hover:scale-[1.015] hover:shadow-cardHover" style={{ backgroundColor: "var(--bmq-cardBg, #FFFFFF)" }}>
        <h3 className="text-base font-semibold text-bmq-dark mb-4">Vendas por período</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={salesMonthly.length ? salesMonthly : salesWeekly.length ? salesWeekly : salesDaily}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={true} horizontal={true} />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11, fill: chartTextColor }}
                axisLine={{ stroke: chartTextColor }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: chartTextColor }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(1)}k`}
                width={48}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #eeeeee", borderRadius: "8px", color: chartTextColor }}
                labelStyle={{ color: chartTextColor }}
                formatter={(value: number) => [`R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Total"]}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke={chartLineColor}
                strokeWidth={2}
                dot={{ fill: chartLineColor, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 4, fill: chartLineColor, stroke: "#E8F5E9", strokeWidth: 2 }}
                name="Total"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-bmq-mid-dark">
          {salesMonthly.length ? "Últimos 12 meses" : salesWeekly.length ? "Últimas 12 semanas" : "Últimos 14 dias"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-card border border-bmq-border bg-white shadow-card p-6 transition-all duration-300 ease-out hover:scale-[1.015] hover:shadow-cardHover" style={{ backgroundColor: "var(--bmq-cardBg, #FFFFFF)" }}>
          <h3 className="text-lg font-semibold text-bmq-dark mb-4">Receitas do mês</h3>
          {receitasDoMes.every((d) => d.total === 0) ? (
            <p className="text-sm text-bmq-mid-dark py-8 text-center">Nenhuma receita no mês</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={receitasDoMes} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 10, fill: chartTextColor }}
                    axisLine={{ stroke: chartTextColor }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: chartTextColor }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    width={48}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #eeeeee", borderRadius: "8px", color: chartTextColor }}
                    formatter={(value: number) => [`R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Receita"]}
                  />
                  <Bar dataKey="total" fill={barReceitas} radius={[4, 4, 0, 0]} name="Receita" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-card border border-bmq-border bg-white shadow-card p-6 transition-all duration-300 ease-out hover:scale-[1.015] hover:shadow-cardHover" style={{ backgroundColor: "var(--bmq-cardBg, #FFFFFF)" }}>
          <h3 className="text-lg font-semibold text-bmq-dark mb-4">Despesas do mês</h3>
          {despesasDoMes.every((d) => d.total === 0) ? (
            <p className="text-sm text-bmq-mid-dark py-8 text-center">Nenhuma despesa no mês</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={despesasDoMes} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 10, fill: chartTextColor }}
                    axisLine={{ stroke: chartTextColor }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: chartTextColor }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    width={48}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #eeeeee", borderRadius: "8px", color: chartTextColor }}
                    formatter={(value: number) => [`R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Despesa"]}
                  />
                  <Bar dataKey="total" fill={barDespesas} radius={[4, 4, 0, 0]} name="Despesa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
