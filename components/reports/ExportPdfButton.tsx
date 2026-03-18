"use client";

import { useState } from "react";
import { FiFileText } from "react-icons/fi";

type PdfResult = { pdfBase64: string; filename: string };

interface ExportPdfButtonPropsBase {
  label?: string;
}

interface ExportPdfButtonPropsCallback extends ExportPdfButtonPropsBase {
  onExport: () => Promise<PdfResult>;
  exportAction?: never;
  exportParams?: never;
}

interface ExportPdfButtonPropsAction<T extends Record<string, unknown>> extends ExportPdfButtonPropsBase {
  onExport?: never;
  exportAction: (params: T) => Promise<PdfResult>;
  exportParams: T;
}

export type ExportPdfButtonProps<T extends Record<string, unknown> = Record<string, unknown>> =
  | ExportPdfButtonPropsCallback
  | ExportPdfButtonPropsAction<T>;

export function ExportPdfButton<T extends Record<string, unknown>>({
  onExport,
  exportAction,
  exportParams,
  label = "Exportar PDF",
}: ExportPdfButtonProps<T>) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const result: PdfResult =
        exportAction && exportParams !== undefined
          ? await exportAction(exportParams as T)
          : await (onExport as () => Promise<PdfResult>)();
      const normalizedPdfBase64 = (result?.pdfBase64 ?? "").replace(/\s/g, "");
      let base64 = normalizedPdfBase64;

      // Alguns geradores podem retornar um "data:application/pdf;base64,..."
      // Em vez de base64 puro; nesse caso, extraimos apos a virgula.
      if (base64.startsWith("data:")) {
        const commaIndex = base64.indexOf(",");
        base64 = commaIndex >= 0 ? base64.slice(commaIndex + 1) : "";
      }

      if (!base64) {
        alert("PDF nao foi gerado. Verifique os dados da venda e do perfil da empresa (Cadastros > Perfil Bem Me Quer).");
        return;
      }

      let binary: string;
      try {
        binary = atob(base64);
      } catch {
        alert("PDF nao foi gerado. O conteudo do PDF esta invalido (base64 corrompido).");
        return;
      }

      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
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
      <FiFileText size={18} />
      {loading ? "Gerando PDF…" : label}
    </button>
  );
}
