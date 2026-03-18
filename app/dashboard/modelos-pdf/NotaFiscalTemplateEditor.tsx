"use client";

import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import type { Tables } from "@/types/database";
import { updateNotaFiscalTemplateAction } from "@/actions/pdf-templates";

const DEFAULT_PRIMARY = "#1e4078";
const DEFAULT_TABLE_HEADER = "#1e4078";
const DEFAULT_TABLE_HEADER_TEXT = "#ffffff";
const DEFAULT_ROW_ALT = "#f5f5f5";
const DEFAULT_LINE = "#d2d2d2";

type NotaFiscalTemplateRow = Tables<"pdf_templates">;

type Draft = {
  primary_color: string;
  table_header_color: string;
  table_header_text_color: string;
  row_alt_color: string;
  line_color: string;
};

const DEFAULT_DRAFT: Draft = {
  primary_color: DEFAULT_PRIMARY,
  table_header_color: DEFAULT_TABLE_HEADER,
  table_header_text_color: DEFAULT_TABLE_HEADER_TEXT,
  row_alt_color: DEFAULT_ROW_ALT,
  line_color: DEFAULT_LINE,
};

function resolveInitialDraft(initialTemplate: NotaFiscalTemplateRow | null): Draft {
  return initialTemplate
    ? {
        primary_color: initialTemplate.primary_color || DEFAULT_PRIMARY,
        table_header_color: initialTemplate.table_header_color || DEFAULT_TABLE_HEADER,
        table_header_text_color: initialTemplate.table_header_text_color || DEFAULT_TABLE_HEADER_TEXT,
        row_alt_color: initialTemplate.row_alt_color || DEFAULT_ROW_ALT,
        line_color: initialTemplate.line_color || DEFAULT_LINE,
      }
    : DEFAULT_DRAFT;
}

function ColorField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: keyof Draft;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-bmq-dark mb-1">{label}</label>
      <div className="flex items-center gap-3">
        <input
          name={name}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 rounded-lg border border-bmq-border bg-white p-0"
        />
        <input
          name={name}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-bmq-border px-3 py-2 text-sm focus:ring-2 focus:ring-bmq-accent focus:border-bmq-accent"
        />
      </div>
    </div>
  );
}

export function NotaFiscalTemplateEditor({ initialTemplate }: { initialTemplate: NotaFiscalTemplateRow | null }) {
  const [draft, setDraft] = useState<Draft>(() => resolveInitialDraft(initialTemplate));

  const [state, formAction] = useFormState(
    async (_prev: { error?: string; success?: boolean }, formData: FormData) => updateNotaFiscalTemplateAction(formData),
    {} as { error?: string; success?: boolean },
  );

  const preview = useMemo(() => {
    return {
      primary: draft.primary_color,
      headerBg: draft.table_header_color,
      headerText: draft.table_header_text_color,
      alt: draft.row_alt_color,
      line: draft.line_color,
    };
  }, [draft]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        {/* Aba: Nota Fiscal */}
        <nav className="flex items-center gap-2 mb-4" aria-label="Abas do editor de template">
          <span className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-t-lg border-b-2 border-bmq-dark text-bmq-dark bg-white">
            Nota Fiscal
          </span>
        </nav>

        <form action={formAction} className="space-y-6">
          <div className="rounded-xl border border-bmq-border bg-white p-6">
            <h2 className="text-lg font-semibold text-bmq-dark mb-4">Cores do template</h2>

            <div className="space-y-4">
              <ColorField
                label="Cor Primária"
                name="primary_color"
                value={draft.primary_color}
                onChange={(next) => setDraft((d) => ({ ...d, primary_color: next }))}
              />
              <ColorField
                label="Fundo do Header da Tabela"
                name="table_header_color"
                value={draft.table_header_color}
                onChange={(next) => setDraft((d) => ({ ...d, table_header_color: next }))}
              />
              <ColorField
                label="Texto do Header da Tabela"
                name="table_header_text_color"
                value={draft.table_header_text_color}
                onChange={(next) => setDraft((d) => ({ ...d, table_header_text_color: next }))}
              />
              <ColorField
                label="Cor Alternada (linhas)"
                name="row_alt_color"
                value={draft.row_alt_color}
                onChange={(next) => setDraft((d) => ({ ...d, row_alt_color: next }))}
              />
              <ColorField
                label="Cor das Linhas (bordas)"
                name="line_color"
                value={draft.line_color}
                onChange={(next) => setDraft((d) => ({ ...d, line_color: next }))}
              />
            </div>

            {state?.error && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {state.error}
              </p>
            )}
            {state?.success && (
              <p className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                Template salvo com sucesso.
              </p>
            )}

            <div className="mt-6 flex items-center justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-bmq-dark px-4 py-2 text-sm font-medium text-white hover:bg-bmq-mid/90"
              >
                Salvar
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-bmq-border bg-white p-6">
        <h2 className="text-lg font-semibold text-bmq-dark mb-4">Preview (modelo)</h2>

        <div className="w-full" style={{ border: `1px solid ${preview.line}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ background: "#fff", padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "flex-end", color: "#6b7280", fontSize: 12 }}>
              EMISSAO: 18/03/2026 • VENDA #4
            </div>
            <div className="grid grid-cols-2 gap-6 mt-6">
              <div>
                <div style={{ background: preview.primary, color: preview.headerText, fontWeight: 700, padding: "6px 8px" }}>
                  PRESTADOR
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: "#111827" }}>
                  EMPRESA: Bem me Quer
                </div>
              </div>
              <div>
                <div style={{ background: preview.primary, color: preview.headerText, fontWeight: 700, padding: "6px 8px" }}>
                  CLIENTE
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: "#111827" }}>
                  NOME: Cliente Exemplo
                </div>
              </div>
            </div>

            <div style={{ marginTop: 18, color: preview.primary, fontWeight: 800, fontSize: 13 }}>
              PRODUTOS / SERVICOS
            </div>

            <div style={{ marginTop: 10, overflow: "hidden", borderRadius: 10 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: preview.headerBg, color: preview.headerText }}>
                    <th style={{ textAlign: "left", fontSize: 11, padding: "6px 8px", border: `1px solid ${preview.line}` }}>QTD.</th>
                    <th style={{ textAlign: "left", fontSize: 11, padding: "6px 8px", border: `1px solid ${preview.line}` }}>DESCRIÇÃO</th>
                    <th style={{ textAlign: "right", fontSize: 11, padding: "6px 8px", border: `1px solid ${preview.line}` }}>VALOR</th>
                    <th style={{ textAlign: "right", fontSize: 11, padding: "6px 8px", border: `1px solid ${preview.line}` }}>SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["10", "Produto Exemplo 1", "R$ 19,99", "R$ 199,90"],
                    ["1", "Produto Exemplo 2", "R$ 18,99", "R$ 18,99"],
                    ["3", "Produto Exemplo 3", "R$ 33,35", "R$ 100,05"],
                  ].map((row, idx) => {
                    const bg = idx % 2 === 1 ? preview.alt : "#fff";
                    return (
                      <tr key={idx} style={{ background: bg }}>
                        <td style={{ fontSize: 12, padding: "8px", border: `1px solid ${preview.line}` }}>{row[0]}</td>
                        <td style={{ fontSize: 12, padding: "8px", border: `1px solid ${preview.line}` }}>{row[1]}</td>
                        <td style={{ fontSize: 12, padding: "8px", border: `1px solid ${preview.line}`, textAlign: "right" }}>{row[2]}</td>
                        <td style={{ fontSize: 12, padding: "8px", border: `1px solid ${preview.line}`, textAlign: "right" }}>{row[3]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, gap: 20 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Subtotal: R$ 413,45</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: preview.primary }}>TOTAL: R$ 413,45</div>
              </div>
            </div>

            <div style={{ marginTop: 16, color: "#9ca3af", fontSize: 11 }}>Gerado em 18/03/2026 • 17:17</div>
          </div>
        </div>

        <p className="text-xs text-bmq-mid-dark mt-4">
          Para ver o resultado real, gere novamente o PDF de uma venda.
        </p>
      </div>
    </div>
  );
}

