"use client";

import { useMemo, useState } from "react";
import { FiCalendar } from "react-icons/fi";

interface BirthDateInputProps {
  /** Valor inicial em ISO (yyyy-mm-dd), ex.: vindo do Supabase */
  initialIso?: string | null;
  id?: string;
}

/**
 * Converte ISO yyyy-mm-dd para exibição dd/mm/aaaa.
 */
function isoToBrDisplay(iso: string | null | undefined): string {
  if (!iso || iso.length < 10) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d || y.length !== 4) return "";
  return `${d}/${m}/${y}`;
}

/**
 * Aplica máscara dd/mm/aaaa a partir apenas de dígitos (máx. 8).
 */
function digitsToBrDisplay(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/**
 * Converte dd/mm/aaaa completo e válido no calendário para ISO yyyy-mm-dd.
 */
function brDisplayToIso(display: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display.trim());
  if (!m) return "";
  const dd = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const yyyy = parseInt(m[3], 10);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yyyy < 1900 || yyyy > 2100) {
    return "";
  }
  const date = new Date(yyyy, mm - 1, dd);
  if (
    date.getFullYear() !== yyyy ||
    date.getMonth() !== mm - 1 ||
    date.getDate() !== dd
  ) {
    return "";
  }
  return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

/**
 * Campo de data de nascimento: digitação em dd/mm/aaaa com máscara;
 * envia ao servidor via input hidden em yyyy-mm-dd.
 */
export function BirthDateInput({ initialIso, id = "birth_date" }: BirthDateInputProps) {
  const [display, setDisplay] = useState(() => isoToBrDisplay(initialIso ?? null));

  const isoValue = useMemo(() => brDisplayToIso(display), [display]);
  const digitsCount = display.replace(/\D/g, "").length;
  const showInvalidHint = digitsCount === 8 && !isoValue;

  function handleChange(raw: string) {
    setDisplay(digitsToBrDisplay(raw));
  }

  return (
    <div className="space-y-1">
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="bday"
          placeholder="dd/mm/aaaa"
          maxLength={10}
          value={display}
          onChange={(e) => handleChange(e.target.value)}
          aria-invalid={showInvalidHint}
          aria-describedby={showInvalidHint ? `${id}-hint` : undefined}
          className="w-full rounded-xl border-2 border-bmq-border bg-white/90 py-2.5 pl-3.5 pr-11 text-bmq-dark shadow-sm transition-[border-color,box-shadow] duration-150 placeholder:text-bmq-placeholder focus:border-bmq-accent focus:outline-none focus:ring-4 focus:ring-bmq-accent/20 tabular-nums tracking-wide"
        />
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-bmq-mid/15 p-1.5 text-bmq-dark"
          aria-hidden
        >
          <FiCalendar size={18} strokeWidth={1.75} />
        </span>
        <input type="hidden" name="birth_date" value={isoValue} />
      </div>
      <p className="text-xs text-bmq-mid-dark/80">Digite dia, mês e ano (8 números).</p>
      {showInvalidHint ? (
        <p id={`${id}-hint`} className="text-xs font-medium text-red-600">
          Esta data não existe no calendário. Confira dia e mês.
        </p>
      ) : null}
    </div>
  );
}
