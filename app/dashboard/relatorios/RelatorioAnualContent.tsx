"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";

export type AnnualReportData = {
  year: number;
  totalEntradas: number;
  totalSaidas: number;
  saldoAnual: number;
  variacaoValor: number;
  variacaoPercentual: number;
  monthlyLine: { mes: string; entradas: number; saidas: number; saldo: number }[];
  monthlyBar: { mes: string; entradas: number; saidas: number }[];
};

interface RelatorioAnualContentProps {
  data: AnnualReportData;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function RelatorioAnualContent({ data }: RelatorioAnualContentProps) {
  const {
    year,
    totalEntradas,
    totalSaidas,
    saldoAnual,
    variacaoValor,
    variacaoPercentual,
    monthlyLine,
    monthlyBar,
  } = data;

  const pathname = usePathname();
  const currentYear = new Date().getFullYear();
  const prevYearUrl = `${pathname}?tab=anual&ano=${year - 1}`;
  const nextYearUrl = `${pathname}?tab=anual&ano=${year + 1}`;
  const canGoNext = year < currentYear;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900">Relatório Anual {year}</h2>
        <div className="inline-flex items-center rounded-full bg-gray-800 px-2 py-2 text-white shadow">
          <Link
            href={prevYearUrl}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/15 transition-colors"
            aria-label="Ano anterior"
          >
            <FiChevronLeft size={20} />
          </Link>
          <span className="min-w-[80px] text-center font-semibold">{year}</span>
          {canGoNext ? (
            <Link
              href={nextYearUrl}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/15 transition-colors"
              aria-label="Próximo ano"
            >
              <FiChevronRight size={20} />
            </Link>
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full opacity-50 cursor-not-allowed">
              <FiChevronRight size={20} />
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 bg-green-50 border border-green-100">
          <p className="text-xs font-medium text-green-800 uppercase tracking-wide">Total de Entradas</p>
          <p className="mt-1 text-lg font-semibold text-green-900">R$ {formatCurrency(totalEntradas)}</p>
        </div>
        <div className="rounded-xl p-4 bg-red-50 border border-red-100">
          <p className="text-xs font-medium text-red-800 uppercase tracking-wide">Total de Saídas</p>
          <p className="mt-1 text-lg font-semibold text-red-900">R$ {formatCurrency(totalSaidas)}</p>
        </div>
        <div className="rounded-xl p-4 bg-blue-50 border border-blue-100">
          <p className="text-xs font-medium text-blue-800 uppercase tracking-wide">Saldo Anual</p>
          <p className="mt-1 text-lg font-semibold text-blue-900">
            R$ {saldoAnual >= 0 ? "" : "-"} {formatCurrency(Math.abs(saldoAnual))}
          </p>
        </div>
        <div className="rounded-xl p-4 bg-violet-50 border border-violet-100">
          <p className="text-xs font-medium text-violet-800 uppercase tracking-wide">Variação vs Ano Anterior</p>
          <p className="mt-1 text-lg font-semibold text-violet-900">
            {variacaoValor >= 0 ? "↑" : "↓"} R$ {formatCurrency(Math.abs(variacaoValor))}
          </p>
          <p className="text-xs text-violet-700 mt-0.5">({variacaoPercentual.toFixed(1)}%)</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Tendências mensais</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyLine} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => [`R$ ${formatCurrency(value)}`, ""]}
                labelFormatter={(label) => label}
              />
              <Legend />
              <Line type="monotone" dataKey="entradas" name="Entradas" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="saidas" name="Saídas" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Comparativo mensal Entradas vs Saídas</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyBar} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
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
        <h3 className="text-base font-semibold text-gray-900 p-4 pb-3 border-b border-gray-100">Resumo por Mês</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                <th className="px-4 py-3">Mês</th>
                <th className="px-4 py-3 text-right">Entradas</th>
                <th className="px-4 py-3 text-right">Saídas</th>
                <th className="px-4 py-3 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {monthlyLine.map((row) => (
                <tr key={row.mes} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.mes}</td>
                  <td className={`px-4 py-3 text-right ${row.entradas > 0 ? "text-green-600 font-medium" : "text-gray-400"}`}>
                    R$ {formatCurrency(row.entradas)}
                  </td>
                  <td className={`px-4 py-3 text-right ${row.saidas > 0 ? "text-red-600 font-medium" : "text-gray-400"}`}>
                    R$ {formatCurrency(row.saidas)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      row.saldo > 0 ? "text-blue-600" : row.saldo < 0 ? "text-red-600" : "text-gray-400"
                    }`}
                  >
                    {row.saldo >= 0 ? "" : "-"}R$ {formatCurrency(Math.abs(row.saldo))}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold">
                <td className="px-4 py-3 text-gray-900">Total</td>
                <td className={`px-4 py-3 text-right ${totalEntradas > 0 ? "text-green-600" : "text-gray-500"}`}>
                  R$ {formatCurrency(totalEntradas)}
                </td>
                <td className={`px-4 py-3 text-right ${totalSaidas > 0 ? "text-red-600" : "text-gray-500"}`}>
                  R$ {formatCurrency(totalSaidas)}
                </td>
                <td
                  className={`px-4 py-3 text-right ${
                    saldoAnual > 0 ? "text-blue-600" : saldoAnual < 0 ? "text-red-600" : "text-gray-500"
                  }`}
                >
                  {saldoAnual >= 0 ? "" : "-"}R$ {formatCurrency(Math.abs(saldoAnual))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
