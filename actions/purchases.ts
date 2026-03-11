"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PurchaseStatus } from "@/types/database";

export type PurchaseFormState = { error?: string };

function parseNum(value: FormDataEntryValue | null): number {
  const n = Number(String(value ?? "0").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Parseia itens do formulário: item_product_id[], item_quantity[], item_unit_cost[]
 */
function parseItems(formData: FormData): { product_id: number; quantity: number; unit_cost: number }[] {
  const productIds = formData.getAll("item_product_id") as string[];
  const quantities = formData.getAll("item_quantity") as string[];
  const unitCosts = formData.getAll("item_unit_cost") as string[];
  const items: { product_id: number; quantity: number; unit_cost: number }[] = [];
  const len = Math.min(productIds.length, quantities.length, unitCosts.length);
  for (let i = 0; i < len; i++) {
    const product_id = Number(productIds[i]);
    const quantity = Math.max(0, Math.floor(parseNum(quantities[i])));
    const unit_cost = Math.max(0, parseNum(unitCosts[i]));
    if (product_id && quantity > 0) {
      items.push({ product_id, quantity, unit_cost });
    }
  }
  return items;
}

/**
 * Cria uma nova compra (status PENDENTE) com itens.
 */
export async function createPurchaseAction(
  _prev: PurchaseFormState,
  formData: FormData
): Promise<PurchaseFormState> {
  const supplier = (formData.get("supplier") as string)?.trim();
  const invoice_number = (formData.get("invoice_number") as string)?.trim() || null;
  const purchase_date = (formData.get("purchase_date") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!supplier || !purchase_date) {
    return { error: "Fornecedor e data são obrigatórios." };
  }

  const items = parseItems(formData);
  if (items.length === 0) {
    return { error: "Adicione ao menos um item à compra." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Usuário não autenticado." };
  }

  const subtotals = items.map((i) => i.quantity * i.unit_cost);
  const total_value = subtotals.reduce((a, b) => a + b, 0);

  const { data: purchaseData, error: errPurchase } = await supabase
    .from("purchases")
    .insert({
      supplier,
      invoice_number,
      purchase_date,
      total_value,
      status: "PENDENTE",
      notes,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (errPurchase) {
    return { error: errPurchase.message };
  }

  const purchaseId = (purchaseData as { id: number }).id;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const subtotal = item.quantity * item.unit_cost;
    await supabase.from("purchase_items").insert({
      purchase_id: purchaseId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      subtotal,
    });
  }

  revalidatePath("/dashboard/compras");
  redirect("/dashboard/compras");
}

/**
 * Atualiza compra PENDENTE (cabeçalho e itens). Substitui todos os itens.
 */
export async function updatePurchaseAction(
  purchaseId: number,
  _prev: PurchaseFormState,
  formData: FormData
): Promise<PurchaseFormState> {
  const supabase = await createClient();
  const { data: purchase } = await supabase
    .from("purchases")
    .select("status")
    .eq("id", purchaseId)
    .single();

  if (!purchase || (purchase as { status: PurchaseStatus }).status !== "PENDENTE") {
    return { error: "Só é possível editar compras com status PENDENTE." };
  }

  const supplier = (formData.get("supplier") as string)?.trim();
  const invoice_number = (formData.get("invoice_number") as string)?.trim() || null;
  const purchase_date = (formData.get("purchase_date") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!supplier || !purchase_date) {
    return { error: "Fornecedor e data são obrigatórios." };
  }

  const items = parseItems(formData);
  if (items.length === 0) {
    return { error: "Adicione ao menos um item à compra." };
  }

  const total_value = items.reduce((acc, i) => acc + i.quantity * i.unit_cost, 0);

  await supabase
    .from("purchases")
    .update({ supplier, invoice_number, purchase_date, total_value, notes })
    .eq("id", purchaseId);

  await supabase.from("purchase_items").delete().eq("purchase_id", purchaseId);

  for (const item of items) {
    await supabase.from("purchase_items").insert({
      purchase_id: purchaseId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      subtotal: item.quantity * item.unit_cost,
    });
  }

  revalidatePath("/dashboard/compras");
  revalidatePath(`/dashboard/compras/${purchaseId}/editar`);
  return {};
}

/**
 * Recebe a mercadoria: atualiza estoque, cria movimentações (ENTRADA/COMPRA) e price_history; status RECEBIDA.
 * Pode ser chamada com (prev, formData) quando usada como form action; use input hidden name="purchase_id".
 */
export async function receivePurchaseAction(
  _prev: PurchaseFormState,
  formData: FormData
): Promise<PurchaseFormState> {
  const purchaseId = Number(formData.get("purchase_id"));
  if (!purchaseId) return { error: "ID da compra não informado." };

  const supabase = await createClient();

  const { data: purchase, error: errPurchase } = await supabase
    .from("purchases")
    .select("id, status")
    .eq("id", purchaseId)
    .single();

  if (errPurchase || !purchase) {
    return { error: "Compra não encontrada." };
  }
  if ((purchase as { status: PurchaseStatus }).status !== "PENDENTE") {
    return { error: "Apenas compras PENDENTES podem ser recebidas." };
  }

  const { data: items, error: errItems } = await supabase
    .from("purchase_items")
    .select("product_id, quantity, unit_cost")
    .eq("purchase_id", purchaseId);

  if (errItems || !items?.length) {
    return { error: "Compra sem itens." };
  }

  const userId = (await supabase.auth.getUser()).data.user?.id ?? null;

  const { data: defaultLocation } = await supabase
    .from("locations")
    .select("id")
    .eq("name", "Principal")
    .maybeSingle();
  const locationId = (defaultLocation as { id: number } | null)?.id;
  if (locationId == null) {
    return { error: "Localização padrão (Principal) não encontrada. Cadastre em Localizações." };
  }

  for (const item of items as { product_id: number; quantity: number; unit_cost: number }[]) {
    const { data: stockRow } = await supabase
      .from("stock")
      .select("id, quantity, cost_price")
      .eq("product_id", item.product_id)
      .eq("location_id", locationId)
      .maybeSingle();

    let stockId: number;
    const qtyBefore = (stockRow as { quantity: number } | null)?.quantity ?? 0;
    const newQuantity = qtyBefore + item.quantity;

    if (stockRow) {
      stockId = (stockRow as { id: number }).id;
      await supabase
        .from("stock")
        .update({
          quantity: newQuantity,
          cost_price: item.unit_cost,
          last_updated: new Date().toISOString(),
        })
        .eq("id", stockId);
    } else {
      const { data: inserted } = await supabase
        .from("stock")
        .insert({
          product_id: item.product_id,
          location_id: locationId,
          quantity: item.quantity,
          cost_price: item.unit_cost,
          min_quantity: 0,
          location: "Principal",
        })
        .select("id")
        .single();
      if (!inserted) continue;
      stockId = (inserted as { id: number }).id;
    }

    await supabase.from("stock_movements").insert({
      stock_id: stockId,
      movement_type: "ENTRADA",
      reason: "COMPRA",
      quantity: item.quantity,
      quantity_before: (stockRow as { quantity: number } | null)?.quantity ?? 0,
      reference: `Compra #${purchaseId}`,
      user_id: userId,
    });

    await supabase.from("price_history").insert({
      stock_id: stockId,
      cost_price: item.unit_cost,
      changed_by: userId,
      reason: `Recebimento compra #${purchaseId}`,
    });
  }

  await supabase.from("purchases").update({ status: "RECEBIDA" }).eq("id", purchaseId);

  revalidatePath("/dashboard/compras");
  revalidatePath(`/dashboard/compras/${purchaseId}`);
  return {};
}

/**
 * Cancela a compra. Se RECEBIDA, reverte estoque e movimentações; senão apenas marca CANCELADA.
 * Pode ser chamada com (prev, formData) quando usada como form action; use input hidden name="purchase_id".
 */
export async function cancelPurchaseAction(
  _prev: PurchaseFormState,
  formData: FormData
): Promise<PurchaseFormState> {
  const purchaseId = Number(formData.get("purchase_id"));
  if (!purchaseId) return { error: "ID da compra não informado." };

  const supabase = await createClient();

  const { data: purchase, error: errPurchase } = await supabase
    .from("purchases")
    .select("id, status")
    .eq("id", purchaseId)
    .single();

  if (errPurchase || !purchase) {
    return { error: "Compra não encontrada." };
  }

  const status = (purchase as { status: PurchaseStatus }).status;
  if (status === "CANCELADA") {
    return { error: "Compra já está cancelada." };
  }

  if (status === "RECEBIDA") {
    const { data: items } = await supabase
      .from("purchase_items")
      .select("product_id, quantity")
      .eq("purchase_id", purchaseId);

    if (items?.length) {
      const userId = (await supabase.auth.getUser()).data.user?.id ?? null;
      for (const item of items as { product_id: number; quantity: number }[]) {
        const { data: stockRow } = await supabase
          .from("stock")
          .select("id, quantity")
          .eq("product_id", item.product_id)
          .single();

        if (!stockRow) continue;
        const stockId = (stockRow as { id: number }).id;
        const qtyBefore = (stockRow as { quantity: number }).quantity;
        const newQty = Math.max(0, qtyBefore - item.quantity);

        await supabase
          .from("stock")
          .update({ quantity: newQty, last_updated: new Date().toISOString() })
          .eq("id", stockId);

        await supabase.from("stock_movements").insert({
          stock_id: stockId,
          movement_type: "SAIDA",
          reason: "AJUSTE",
          quantity: -item.quantity,
          quantity_before: qtyBefore,
          reference: `Cancelamento compra #${purchaseId}`,
          notes: "Cancelamento da compra",
          user_id: userId,
        });
      }
    }
  }

  await supabase.from("purchases").update({ status: "CANCELADA" }).eq("id", purchaseId);

  revalidatePath("/dashboard/compras");
  revalidatePath(`/dashboard/compras/${purchaseId}`);
  return {};
}
