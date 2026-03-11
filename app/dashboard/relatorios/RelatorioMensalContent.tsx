"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MonthPicker } from "@/components/dashboard/MonthPicker";

export type MonthlyReportData = {
  yearMonth: string;
  monthLabel: string;
  totalEntradas: number;
  totalSaidas: number;
  saldoResultante: number;
  saldoEmCaixa: number;
  variacaoValor: number;
  variacaoPercentual: number;
  chartData: { mes: string; entradas: number; saidas: number }[];
  transacoes: {
    date: string;
    description: string;
    category: string;
    member: string;
    type: "Entrada" | "Saída";
    value: number;
  }[];
};

interface RelatorioMensalContentProps {
  data: MonthlyReportData;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function RelatorioMensalContent({ data }: RelatorioMensalContentProps) {
  const {
    yearMonth,
    monthLabel,
    totalEntradas,
    totalSaidas,
    saldoResultante,
    saldoEmCaixa,
    variacaoValor,
    variacaoPercentual,
    chartData,
    transacoes,
  } = data;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900">Relatório de {monthLabel}</h2>
        <MonthPicker yearMonth={yearMonth} allowFutureMonths={false} preserveParams={{ tab: "mensal" }} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="rounded-xl p-4 bg-green-50 border border-green-100">
          <p className="text-xs font-medium text-green-800 uppercase tracking-wide">Total de Entradas</p>
          <p className="mt-1 text-lg font-semibold text-green-900">R$ {formatCurrency(totalEntradas)}</p>
        </div>
        <div className="rounded-xl p-4 bg-red-50 border border-red-100">
          <p className="text-xs font-medium text-red-800 uppercase tracking-wide">Total de Saídas</p>
          <p className="mt-1 text-lg font-semibold text-red-900">R$ {formatCurrency(totalSaidas)}</p>
        </div>
        <div className="rounded-xl p-4 bg-amber-50 border border-amber-100">
          <p className="text-xs font-medium text-amber-800 uppercase tracking-wide">Saldo Resultante</p>
          <p className="mt-1 text-lg font-semibold text-amber-900">
            R$ {saldoResultante >= 0 ? "" : "-"} {formatCurrency(Math.abs(saldoResultante))}
          </p>
          <p className="text-xs text-amber-700 mt-0.5">Entradas - Saídas</p>
        </div>
        <div className="rounded-xl p-4 bg-blue-50 border border-blue-100">
          <p className="text-xs font-medium text-blue-800 uppercase tracking-wide">Saldo em Caixa</p>
          <p className="mt-1 text-lg font-semibold text-blue-900">R$ {formatCurrency(saldoEmCaixa)}</p>
          <p className="text-xs text-blue-700 mt-0.5">Saldo Cumulativo</p>
        </div>
        <div className="rounded-xl p-4 bg-violet-50 border border-violet-100">
          <p className="text-xs font-medium text-violet-800 uppercase tracking-wide">Variação vs Mês Anterior</p>
          <p className="mt-1 text-lg font-semibold text-violet-900">
            {variacaoValor >= 0 ? "↑" : "↓"} R$ {formatCurrency(Math.abs(variacaoValor))}
          </p>
          <p className="text-xs text-violet-700 mt-0.5">
            ({variacaoPercentual >= 0 ? "+" : ""}{variacaoPercentual.toFixed(1)}%)
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Comparativo Entradas vs Saídas</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number) => [`R$ ${formatCurrency(value)}`, ""]}
                labelFormatter={(label) => label}
              />
              <Legend />
              <Bar dataKey="entradas" name="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saidas" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <h3 className="text-base font-semibold text-gray-900 p-4 pb-2">Todas as Transações do Mês</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Cliente / Fornecedor</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transacoes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Nenhuma transação no período.
                  </td>
                </tr>
              ) : (
                transacoes.map((t, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-700">{t.date}</td>
                    <td className="px-4 py-3 text-gray-900">{t.description}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{t.member || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          t.type === "Entrada"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        t.type === "Entrada" ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {t.type === "Entrada" ? "+" : "-"}R$ {formatCurrency(Math.abs(t.value))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
