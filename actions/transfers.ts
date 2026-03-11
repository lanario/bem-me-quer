"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TransferStatus } from "@/types/database";

export type TransferFormState = { error?: string };

/**
 * Cria uma ou mais transferências (status PENDENTE), uma por item.
 * Origem e destino são únicos; cada linha é um produto + quantidade.
 */
export async function createTransferAction(
  _prev: TransferFormState,
  formData: FormData
): Promise<TransferFormState> {
  const from_location = (formData.get("from_location") as string)?.trim();
  const to_location = (formData.get("to_location") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim() || null;

  const productIds = formData.getAll("item_product_id").map((v) => Number(v));
  const quantities = formData.getAll("item_quantity").map((v) =>
    Math.max(1, Math.floor(Number(v) || 0))
  );

  if (!from_location || !to_location) {
    return { error: "Origem e destino são obrigatórios." };
  }
  if (from_location === to_location) {
    return { error: "Origem e destino devem ser diferentes." };
  }
  if (
    productIds.length === 0 ||
    productIds.some((id) => !id) ||
    productIds.length !== quantities.length
  ) {
    return { error: "Adicione ao menos um item (produto e quantidade)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Usuário não autenticado." };

  const rows = productIds.map((product_id, i) => ({
    from_location,
    to_location,
    product_id,
    quantity: quantities[i] ?? 1,
    notes,
    created_by: user.id,
  }));

  const { error } = await supabase.from("stock_transfers").insert(rows);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/transferencias");
  redirect("/dashboard/transferencias");
}

/**
 * Confirma a transferência: valida estoque na origem, cria movimentações (SAIDA + ENTRADA) e atualiza quantidade nos dois locais.
 * Estoque pode ter vários registros por produto (um por localização); transferência move entre dois registros.
 */
export async function confirmTransferAction(
  _prev: TransferFormState,
  formData: FormData
): Promise<TransferFormState> {
  const transferId = Number(formData.get("transfer_id"));
  if (!transferId) return { error: "ID da transferência não informado." };

  const supabase = await createClient();
  const { data: transfer, error: errT } = await supabase
    .from("stock_transfers")
    .select("id, from_location, to_location, product_id, quantity, status")
    .eq("id", transferId)
    .single();

  if (errT || !transfer) return { error: "Transferência não encontrada." };
  const t = transfer as { from_location: string; to_location: string; product_id: number; quantity: number; status: TransferStatus };
  if (t.status !== "PENDENTE") return { error: "Apenas transferências PENDENTES podem ser confirmadas." };

  const { data: fromLoc } = await supabase.from("locations").select("id").eq("name", t.from_location).single();
  const { data: toLoc } = await supabase.from("locations").select("id").eq("name", t.to_location).single();
  if (!fromLoc || !toLoc) return { error: "Local de origem ou destino não encontrado. Verifique o cadastro em Localizações." };

  const fromLocationId = (fromLoc as { id: number }).id;
  const toLocationId = (toLoc as { id: number }).id;

  const { data: stockOrigin } = await supabase
    .from("stock")
    .select("id, quantity")
    .eq("product_id", t.product_id)
    .eq("location_id", fromLocationId)
    .single();

  if (!stockOrigin) return { error: `Estoque do produto não encontrado na origem (${t.from_location}).` };
  const origin = stockOrigin as { id: number; quantity: number };
  if (origin.quantity < t.quantity) {
    return { error: `Estoque insuficiente na origem: disponível ${origin.quantity}, solicitado ${t.quantity}.` };
  }

  let dest = await supabase
    .from("stock")
    .select("id, quantity")
    .eq("product_id", t.product_id)
    .eq("location_id", toLocationId)
    .single();

  let destStockId: number;
  let destQtyBefore: number;
  if (dest.data) {
    destStockId = (dest.data as { id: number; quantity: number }).id;
    destQtyBefore = (dest.data as { id: number; quantity: number }).quantity;
  } else {
    const { data: inserted } = await supabase.from("stock").insert({
      product_id: t.product_id,
      location_id: toLocationId,
      quantity: 0,
      min_quantity: 0,
      cost_price: 0,
      location: t.to_location,
    }).select("id").single();
    if (!inserted) return { error: "Não foi possível criar registro de estoque no destino." };
    destStockId = (inserted as { id: number }).id;
    destQtyBefore = 0;
  }

  const userId = (await supabase.auth.getUser()).data.user?.id ?? null;
  const ref = `Transferência #${transferId}`;

  await supabase.from("stock_movements").insert({
    stock_id: origin.id,
    movement_type: "SAIDA",
    reason: "AJUSTE",
    quantity: -t.quantity,
    quantity_before: origin.quantity,
    reference: ref,
    notes: `De ${t.from_location} para ${t.to_location}`,
    user_id: userId,
  });
  await supabase.from("stock_movements").insert({
    stock_id: destStockId,
    movement_type: "ENTRADA",
    reason: "AJUSTE",
    quantity: t.quantity,
    quantity_before: destQtyBefore,
    reference: ref,
    notes: `De ${t.from_location} para ${t.to_location}`,
    user_id: userId,
  });
  await supabase.from("stock").update({
    quantity: origin.quantity - t.quantity,
    location: t.from_location,
    last_updated: new Date().toISOString(),
  }).eq("id", origin.id);
  await supabase.from("stock").update({
    quantity: destQtyBefore + t.quantity,
    location: t.to_location,
    last_updated: new Date().toISOString(),
  }).eq("id", destStockId);
  await supabase.from("stock_transfers").update({ status: "CONCLUIDA" }).eq("id", transferId);

  revalidatePath("/dashboard/transferencias");
  revalidatePath(`/dashboard/transferencias/${transferId}`);
  return {};
}

/**
 * Cancela a transferência. Se CONCLUIDA, reverte movimentações e localização do estoque.
 */
export async function cancelTransferAction(
  _prev: TransferFormState,
  formData: FormData
): Promise<TransferFormState> {
  const transferId = Number(formData.get("transfer_id"));
  if (!transferId) return { error: "ID da transferência não informado." };

  const supabase = await createClient();
  const { data: transfer, error } = await supabase
    .from("stock_transfers")
    .select("id, from_location, to_location, product_id, quantity, status")
    .eq("id", transferId)
    .single();

  if (error || !transfer) return { error: "Transferência não encontrada." };
  const t = transfer as { from_location: string; to_location: string; product_id: number; quantity: number; status: TransferStatus };
  if (t.status === "CANCELADA") return { error: "Transferência já está cancelada." };

  if (t.status === "CONCLUIDA") {
    const { data: fromLoc } = await supabase.from("locations").select("id").eq("name", t.from_location).single();
    const { data: toLoc } = await supabase.from("locations").select("id").eq("name", t.to_location).single();
    if (!fromLoc || !toLoc) return { error: "Local de origem ou destino não encontrado." };
    const fromId = (fromLoc as { id: number }).id;
    const toId = (toLoc as { id: number }).id;
    const { data: stockFrom } = await supabase.from("stock").select("id, quantity").eq("product_id", t.product_id).eq("location_id", fromId).single();
    const { data: stockTo } = await supabase.from("stock").select("id, quantity").eq("product_id", t.product_id).eq("location_id", toId).single();
    if (!stockFrom || !stockTo) return { error: "Registros de estoque origem/destino não encontrados." };
    const fromRow = stockFrom as { id: number; quantity: number };
    const toRow = stockTo as { id: number; quantity: number };
    const userId = (await supabase.auth.getUser()).data.user?.id ?? null;
    const ref = `Cancelamento transferência #${transferId}`;
    await supabase.from("stock_movements").insert({
      stock_id: fromRow.id,
      movement_type: "ENTRADA",
      reason: "AJUSTE",
      quantity: t.quantity,
      quantity_before: fromRow.quantity,
      reference: ref,
      notes: `Devolução a ${t.from_location}`,
      user_id: userId,
    });
    await supabase.from("stock_movements").insert({
      stock_id: toRow.id,
      movement_type: "SAIDA",
      reason: "AJUSTE",
      quantity: -t.quantity,
      quantity_before: toRow.quantity,
      reference: ref,
      notes: `Reversão de ${t.to_location}`,
      user_id: userId,
    });
    await supabase.from("stock").update({
      quantity: fromRow.quantity + t.quantity,
      last_updated: new Date().toISOString(),
    }).eq("id", fromRow.id);
    await supabase.from("stock").update({
      quantity: toRow.quantity - t.quantity,
      last_updated: new Date().toISOString(),
    }).eq("id", toRow.id);
  }

  await supabase.from("stock_transfers").update({ status: "CANCELADA" }).eq("id", transferId);
  revalidatePath("/dashboard/transferencias");
  revalidatePath(`/dashboard/transferencias/${transferId}`);
  return {};
}
