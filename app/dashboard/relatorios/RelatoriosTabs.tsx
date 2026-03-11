"use client";

import Link from "next/link";
import { FiCalendar, FiTrendingUp, FiFileText, FiRepeat, FiDroplet, FiDollarSign } from "react-icons/fi";

export type RelatorioTab =
  | "mensal"
  | "anual"
  | "estoque-atual"
  | "movimentacoes"
  | "estoque-baixo"
  | "valor-estoque";

const TAB_CONFIG: { id: RelatorioTab; label: string; icon: typeof FiCalendar; path: string }[] = [
  { id: "mensal", label: "Relatório Mensal", icon: FiCalendar, path: "/dashboard/relatorios" },
  { id: "anual", label: "Relatório Anual", icon: FiTrendingUp, path: "/dashboard/relatorios" },
  { id: "estoque-atual", label: "Estoque Atual", icon: FiFileText, path: "/dashboard/relatorios/estoque-atual" },
  { id: "movimentacoes", label: "Movimentações", icon: FiRepeat, path: "/dashboard/relatorios/movimentacoes" },
  { id: "estoque-baixo", label: "Estoque Baixo", icon: FiDroplet, path: "/dashboard/relatorios/estoque-baixo" },
  { id: "valor-estoque", label: "Valor de Estoque", icon: FiDollarSign, path: "/dashboard/relatorios/valor-estoque" },
];

interface RelatoriosTabsProps {
  currentTab: RelatorioTab;
  /** Parâmetros para Mensal/Anual (mes, ano). Usado quando path = /dashboard/relatorios */
  searchParams?: Record<string, string>;
}

export function RelatoriosTabs({ currentTab, searchParams = {} }: RelatoriosTabsProps) {
  function href(t: RelatorioTab): string {
    const config = TAB_CONFIG.find((c) => c.id === t)!;
    if (t === "mensal" || t === "anual") {
      const params = new URLSearchParams({ tab: t });
      if (t === "mensal" && searchParams.mes) params.set("mes", searchParams.mes);
      if (t === "anual" && searchParams.ano) params.set("ano", searchParams.ano);
      return `${config.path}?${params.toString()}`;
    }
    return config.path;
  }

  return (
    <nav className="flex flex-wrap gap-1 border-b border-gray-200 mb-6" aria-label="Abas de relatórios">
      {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
        <Link
          key={id}
          href={href(id)}
          className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
            currentTab === id
              ? "border-bmq-dark text-bmq-dark bg-white"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Icon size={18} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
