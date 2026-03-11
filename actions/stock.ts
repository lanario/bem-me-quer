"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type AdjustmentReason = "INVENTARIO" | "PERDA" | "ACHADO" | "CORRECAO";

export type AdjustStockFormState = { error?: string };

/**
 * Ajusta a quantidade do estoque e registra movimentação (tipo AJUSTE).
 * Motivo detalhado (INVENTARIO, PERDA, ACHADO, CORRECAO) vai nas observações.
 */
export async function adjustStockAction(
  stockId: number,
  _prev: AdjustStockFormState,
  formData: FormData
): Promise<AdjustStockFormState> {
  const newQuantity = Math.max(0, Math.floor(Number(formData.get("new_quantity")) || 0));
  const minQuantity = Math.max(0, Math.floor(Number(formData.get("min_quantity")) || 0));
  const reason = (formData.get("reason") as AdjustmentReason) || "CORRECAO";
  const notes = (formData.get("notes") as string)?.trim() || "";

  const validReasons: AdjustmentReason[] = ["INVENTARIO", "PERDA", "ACHADO", "CORRECAO"];
  if (!validReasons.includes(reason)) {
    return { error: "Motivo inválido." };
  }

  const supabase = await createClient();

  const { data: stock, error: errStock } = await supabase
    .from("stock")
    .select("id, product_id, quantity")
    .eq("id", stockId)
    .single();

  if (errStock || !stock) {
    return { error: "Estoque não encontrado." };
  }

  const currentQty = (stock as { quantity: number }).quantity;
  const diff = newQuantity - currentQty;

  if (diff !== 0) {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? null;
    const reasonLabel = { INVENTARIO: "Inventário", PERDA: "Perda", ACHADO: "Achado", CORRECAO: "Correção" }[reason];
    const movementNotes = `Motivo: ${reasonLabel}. ${notes}`.trim();

    // @ts-ignore Supabase client generic inference
    const { error: errMov } = await supabase.from("stock_movements").insert({
      stock_id: stockId,
      movement_type: "AJUSTE",
      reason: "AJUSTE",
      quantity: diff,
      quantity_before: currentQty,
      reference: "Ajuste manual",
      notes: movementNotes,
      user_id: userId,
    });

    if (errMov) {
      return { error: errMov.message };
    }
  }

  // Atualiza quantidade e estoque mínimo (sempre aplica min_quantity; quantidade só se houve ajuste)
  const updatePayload: { quantity?: number; min_quantity: number } = { min_quantity: minQuantity };
  if (diff !== 0) updatePayload.quantity = newQuantity;

  const { error: errUpdate } = await supabase
    .from("stock")
    // @ts-ignore
    .update(updatePayload)
    .eq("id", stockId);

  if (errUpdate) {
    return { error: errUpdate.message };
  }

  revalidatePath("/dashboard/estoque");
  revalidatePath(`/dashboard/estoque/${stockId}/ajustar`);
  redirect("/dashboard/estoque");
}
