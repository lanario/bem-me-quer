"use client";

import { useState } from "react";
import { FiDownload } from "react-icons/fi";

type CsvResult = { csv: string; filename: string };

interface ExportCsvButtonPropsBase {
  label?: string;
}

/** Uso com callback (evite em Server Components: prefira exportAction + exportParams) */
interface ExportCsvButtonPropsCallback extends ExportCsvButtonPropsBase {
  onExport: () => Promise<CsvResult>;
  exportAction?: never;
  exportParams?: never;
}

/** Uso com Server Action + params serializáveis (recomendado em páginas server) */
interface ExportCsvButtonPropsAction<T extends Record<string, unknown>> extends ExportCsvButtonPropsBase {
  onExport?: never;
  exportAction: (params: T) => Promise<CsvResult>;
  exportParams: T;
}

export type ExportCsvButtonProps<T extends Record<string, unknown> = Record<string, unknown>> =
  | ExportCsvButtonPropsCallback
  | ExportCsvButtonPropsAction<T>;

export function ExportCsvButton<T extends Record<string, unknown>>({
  onExport,
  exportAction,
  exportParams,
  label = "Exportar CSV",
}: ExportCsvButtonProps<T>) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const result: CsvResult =
        exportAction && exportParams !== undefined
          ? await exportAction(exportParams as T)
          : await (onExport as () => Promise<CsvResult>)();
      const { csv, filename } = result;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg border border-bmq-border bg-white px-4 py-2 text-sm font-medium text-bmq-dark hover:bg-bmq-mid/20 disabled:opacity-50"
    >
      <FiDownload size={18} />
      {loading ? "Exportando…" : label}
    </button>
  );
}
