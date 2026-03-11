"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Finaliza um mês e grava o saldo resultante (receitas - despesas).
 * Esse valor passa a ser o Saldo Atual do mês seguinte.
 */
export async function finalizeMonth(year: number, month: number, saldoResultante: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("monthly_closings").upsert(
    { year, month, saldo_resultante: saldoResultante },
    { onConflict: "year,month" }
  );
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/dashboard");
  return { ok: true };
}
