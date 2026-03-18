"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Tables } from "@/types/database";

const DEFAULT_PRIMARY = "#1e4078";
const DEFAULT_TABLE_HEADER = "#1e4078";
const DEFAULT_TABLE_HEADER_TEXT = "#ffffff";
const DEFAULT_ROW_ALT = "#f5f5f5";
const DEFAULT_LINE = "#d2d2d2";

function normalizeHexColor(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  const isValid = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);
  return isValid ? v : DEFAULT_PRIMARY;
}

function normalizeHexColorOptional(value: string | null | undefined, fallback: string): string {
  const v = (value ?? "").trim();
  const isValid = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);
  return isValid ? v : fallback;
}

export async function getNotaFiscalTemplate(): Promise<Tables<"pdf_templates"> | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pdf_templates")
    .select("*")
    .eq("template_key", "nota_fiscal")
    .single();

  if (error || !data) return null;
  return data as Tables<"pdf_templates">;
}

export async function updateNotaFiscalTemplateAction(
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  const primary_color = normalizeHexColor(formData.get("primary_color") as string | null);
  const table_header_color = normalizeHexColorOptional(
    formData.get("table_header_color") as string | null,
    DEFAULT_TABLE_HEADER,
  );
  const table_header_text_color = normalizeHexColorOptional(
    formData.get("table_header_text_color") as string | null,
    DEFAULT_TABLE_HEADER_TEXT,
  );
  const row_alt_color = normalizeHexColorOptional(formData.get("row_alt_color") as string | null, DEFAULT_ROW_ALT);
  const line_color = normalizeHexColorOptional(formData.get("line_color") as string | null, DEFAULT_LINE);

  const supabase = await createClient();
  const { error } = await supabase.from("pdf_templates").upsert(
    {
      template_key: "nota_fiscal",
      primary_color,
      table_header_color,
      table_header_text_color,
      row_alt_color,
      line_color,
    },
    { onConflict: "template_key" },
  );

  if (error) return { error: error.message };

  revalidatePath("/dashboard/modelos-pdf");
  return { success: true };
}

