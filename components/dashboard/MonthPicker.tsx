"use client";

import { useRouter, usePathname } from "next/navigation";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export interface MonthPickerProps {
  /** Ano e mês no formato YYYY-MM */
  yearMonth: string;
  /** Se true, desabilita o botão "próximo" quando já está no mês atual */
  allowFutureMonths?: boolean;
  /** Parâmetros extras a preservar na URL (ex: { tab: "mensal" }) */
  preserveParams?: Record<string, string>;
}

/**
 * Exibe o mês/ano atual e permite navegar entre meses pela URL (?mes=YYYY-MM).
 * Estilo: barra escura arredondada com setas, como no modelo de referência.
 */
export function MonthPicker({ yearMonth, allowFutureMonths = false, preserveParams }: MonthPickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [year, month] = yearMonth.split("-").map(Number);
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  const today = new Date();
  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const nextIsFuture = nextMonth.year > today.getFullYear() || (nextMonth.year === today.getFullYear() && nextMonth.month > today.getMonth() + 1);

  function goTo(yr: number, mo: number) {
    const mes = `${yr}-${String(mo).padStart(2, "0")}`;
    const params = new URLSearchParams({ ...preserveParams, mes });
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="inline-flex items-center rounded-full bg-bmq-dark px-4 py-2 text-white shadow-card">
      <button
        type="button"
        onClick={() => goTo(prevMonth.year, prevMonth.month)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/15 transition-colors"
        aria-label="Mês anterior"
      >
        <FiChevronLeft size={20} />
      </button>
      <span className="min-w-[140px] text-center font-semibold">
        {monthLabel}
      </span>
      <button
        type="button"
        onClick={() => {
          if (allowFutureMonths || !nextIsFuture) goTo(nextMonth.year, nextMonth.month);
        }}
        disabled={!allowFutureMonths && nextIsFuture}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        aria-label="Próximo mês"
      >
        <FiChevronRight size={20} />
      </button>
    </div>
  );
}
