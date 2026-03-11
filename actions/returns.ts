"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ReturnReason, ReturnStatus } from "@/types/database";

export type ReturnFormState = { error?: string };

export type SellItemForReturn = {
  id: number;
  quantity: number;
  products: { title: string } | null;
};

/**
 * Retorna itens da venda para o formulário de devolução (apenas vendas CONCLUIDA).
 */
export async function getSellItemsForReturn(sellId: number): Promise<SellItemForReturn[]> {
  const supabase = await createClient();
  const { data: sell } = await supabase.from("sells").select("status").eq("id", sellId).single();
  if (!sell || (sell as { status: string }).status !== "CONCLUIDA") return [];
  const { data: items } = await supabase
    .from("sell_items")
    .select("id, quantity, products(title)")
    .eq("sell_id", sellId);
  return (items ?? []) as SellItemForReturn[];
}

/**
 * Parseia itens do formulário: item_sell_item_id[], item_quantity[], item_condition[], item_restock[]
 */
function parseReturnItems(formData: FormData): {
  sell_item_id: number;
  quantity: number;
  condition: "NOVO" | "USADO" | "DANIFICADO";
  restock: boolean;
}[] {
  const sellItemIds = formData.getAll("item_sell_item_id") as string[];
  const quantities = formData.getAll("item_quantity") as string[];
  const conditions = formData.getAll("item_condition") as string[];
  const restocks = formData.getAll("item_restock") as string[];
  const validConditions = ["NOVO", "USADO", "DANIFICADO"] as const;
  const items: { sell_item_id: number; quantity: number; condition: typeof validConditions[number]; restock: boolean }[] = [];
  const len = Math.min(sellItemIds.length, quantities.length, conditions.length);
  for (let i = 0; i < len; i++) {
    const sell_item_id = Number(sellItemIds[i]);
    const quantity = Math.max(0, Math.floor(Number(quantities[i]) || 0));
    const cond = validConditions.includes(conditions[i] as typeof validConditions[number])
      ? (conditions[i] as typeof validConditions[number])
      : "USADO";
    const restock = restocks[i] === "true" || restocks[i] === "on";
    if (sell_item_id && quantity > 0) {
      items.push({ sell_item_id, quantity, condition: cond, restock });
    }
  }
  return items;
}

/**
 * Cria uma nova devolução (status PENDENTE). Valida quantidade devolvida <= quantidade vendida por item.
 */
export async function createReturnAction(
  _prev: ReturnFormState,
  formData: FormData
): Promise<ReturnFormState> {
  const sell_id = Number(formData.get("sell_id"));
  const reason = (formData.get("reason") as ReturnReason) || "OUTRO";
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!sell_id) return { error: "Venda é obrigatória." };

  const items = parseReturnItems(formData);
  if (items.length === 0) return { error: "Adicione ao menos um item à devolução." };

  const supabase = await createClient();
  const { data: sellItems } = await supabase
    .from("sell_items")
    .select("id, quantity")
    .eq("sell_id", sell_id);
  const soldMap = new Map((sellItems ?? []).map((s) => [s.id, (s as { quantity: number }).quantity]));

  for (const item of items) {
    const sold = soldMap.get(item.sell_item_id) ?? 0;
    if (item.quantity > sold) {
      return { error: `Quantidade devolvida não pode ser maior que a vendida (item: ${item.sell_item_id}).` };
    }
  }

  const { data: returnData, error: errReturn } = await supabase
    .from("returns")
    .insert({ sell_id, reason, notes, status: "PENDENTE" })
    .select("id")
    .single();

  if (errReturn) return { error: errReturn.message };
  const returnId = (returnData as { id: number }).id;

  for (const item of items) {
    await supabase.from("return_items").insert({
      return_id: returnId,
      sell_item_id: item.sell_item_id,
      quantity: item.quantity,
      condition: item.condition,
      restock: item.restock,
    });
  }

  revalidatePath("/dashboard/devolucoes");
  redirect("/dashboard/devolucoes");
}

/**
 * Aprova a devolução: para itens com restock=true, cria ENTRADA DEVOLUCAO_CLIENTE; status APROVADA.
 */
export async function approveReturnAction(
  _prev: ReturnFormState,
  formData: FormData
): Promise<ReturnFormState> {
  const returnId = Number(formData.get("return_id"));
  if (!returnId) return { error: "ID da devolução não informado." };

  const supabase = await createClient();
  const { data: ret, error: errRet } = await supabase
    .from("returns")
    .select("id, status")
    .eq("id", returnId)
    .single();

  if (errRet || !ret) return { error: "Devolução não encontrada." };
  if ((ret as { status: ReturnStatus }).status !== "PENDENTE") {
    return { error: "Apenas devoluções PENDENTES podem ser aprovadas." };
  }

  const { data: items } = await supabase
    .from("return_items")
    .select("id, sell_item_id, quantity, restock")
    .eq("return_id", returnId);

  const userId = (await supabase.auth.getUser()).data.user?.id ?? null;

  for (const ri of items ?? []) {
    const row = ri as { sell_item_id: number; quantity: number; restock: boolean };
    if (!row.restock) continue;
    const { data: sellItem } = await supabase
      .from("sell_items")
      .select("product_id")
      .eq("id", row.sell_item_id)
      .single();
    if (!sellItem) continue;
    const product_id = (sellItem as { product_id: number }).product_id;
    const { data: stockRow } = await supabase
      .from("stock")
      .select("id, quantity")
      .eq("product_id", product_id)
      .single();
    if (!stockRow) continue;
    const stockId = (stockRow as { id: number }).id;
    const qtyBefore = (stockRow as { quantity: number }).quantity;
    await supabase.from("stock").update({
      quantity: qtyBefore + row.quantity,
      last_updated: new Date().toISOString(),
    }).eq("id", stockId);
    await supabase.from("stock_movements").insert({
      stock_id: stockId,
      movement_type: "ENTRADA",
      reason: "DEVOLUCAO_CLIENTE",
      quantity: row.quantity,
      quantity_before: qtyBefore,
      reference: `Devolução #${returnId}`,
      notes: "Aprovação de devolução",
      user_id: userId,
    });
  }

  await supabase.from("returns").update({
    status: "APROVADA",
    processed_by: userId,
  }).eq("id", returnId);

  revalidatePath("/dashboard/devolucoes");
  revalidatePath(`/dashboard/devolucoes/${returnId}`);
  return {};
}

/**
 * Rejeita a devolução. Se estava APROVADA, reverte as reposições (SAIDA).
 */
export async function rejectReturnAction(
  _prev: ReturnFormState,
  formData: FormData
): Promise<ReturnFormState> {
  const returnId = Number(formData.get("return_id"));
  if (!returnId) return { error: "ID da devolução não informado." };

  const supabase = await createClient();
  const { data: ret, error } = await supabase
    .from("returns")
    .select("id, status")
    .eq("id", returnId)
    .single();

  if (error || !ret) return { error: "Devolução não encontrada." };
  const status = (ret as { status: ReturnStatus }).status;
  if (status === "REJEITADA") return { error: "Devolução já está rejeitada." };

  const userId = (await supabase.auth.getUser()).data.user?.id ?? null;

  if (status === "APROVADA") {
    const { data: items } = await supabase
      .from("return_items")
      .select("sell_item_id, quantity, restock")
      .eq("return_id", returnId);
    for (const ri of items ?? []) {
      const row = ri as { sell_item_id: number; quantity: number; restock: boolean };
      if (!row.restock) continue;
      const { data: sellItem } = await supabase
        .from("sell_items")
        .select("product_id")
        .eq("id", row.sell_item_id)
        .single();
      if (!sellItem) continue;
      const product_id = (sellItem as { product_id: number }).product_id;
      const { data: stockRow } = await supabase
        .from("stock")
        .select("id, quantity")
        .eq("product_id", product_id)
        .single();
      if (!stockRow) continue;
      const stockId = (stockRow as { id: number }).id;
      const qtyBefore = (stockRow as { quantity: number }).quantity;
      await supabase.from("stock").update({
        quantity: Math.max(0, qtyBefore - row.quantity),
        last_updated: new Date().toISOString(),
      }).eq("id", stockId);
      await supabase.from("stock_movements").insert({
        stock_id: stockId,
        movement_type: "SAIDA",
        reason: "AJUSTE",
        quantity: -row.quantity,
        quantity_before: qtyBefore,
        reference: `Rejeição devolução #${returnId}`,
        notes: "Reversão da aprovação",
        user_id: userId,
      });
    }
  }

  await supabase.from("returns").update({
    status: "REJEITADA",
    processed_by: userId,
  }).eq("id", returnId);

  revalidatePath("/dashboard/devolucoes");
  revalidatePath(`/dashboard/devolucoes/${returnId}`);
  return {};
}
