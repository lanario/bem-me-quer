"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SellStatus } from "@/types/database";

export type SellFormState = { error?: string };

function parseNum(value: FormDataEntryValue | null): number {
  const n = Number(String(value ?? "0").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Parseia itens do formulário: item_product_id[], item_quantity[], item_unitary_price[]
 */
function parseItems(formData: FormData): { product_id: number; quantity: number; unitary_price: number }[] {
  const productIds = formData.getAll("item_product_id") as string[];
  const quantities = formData.getAll("item_quantity") as string[];
  const prices = formData.getAll("item_unitary_price") as string[];
  const items: { product_id: number; quantity: number; unitary_price: number }[] = [];
  const len = Math.min(productIds.length, quantities.length, prices.length);
  for (let i = 0; i < len; i++) {
    const product_id = Number(productIds[i]);
    const quantity = Math.max(0, Math.floor(parseNum(quantities[i])));
    const unitary_price = Math.max(0, parseNum(prices[i]));
    if (product_id && quantity > 0) {
      items.push({ product_id, quantity, unitary_price });
    }
  }
  return items;
}

/**
 * Verifica se há estoque suficiente para os itens. Retorna mensagem de erro ou null.
 */
async function validateStock(
  supabase: Awaited<ReturnType<typeof createClient>>,
  items: { product_id: number; quantity: number }[]
): Promise<string | null> {
  for (const item of items) {
    const { data: stock } = await supabase
      .from("stock")
      .select("quantity")
      .eq("product_id", item.product_id)
      .single();
    const available = (stock as { quantity: number } | null)?.quantity ?? 0;
    if (available < item.quantity) {
      const { data: product } = await supabase
        .from("products")
        .select("title")
        .eq("id", item.product_id)
        .single();
      const name = (product as { title: string } | null)?.title ?? `Produto #${item.product_id}`;
      return `Estoque insuficiente para "${name}": disponível ${available}, solicitado ${item.quantity}.`;
    }
  }
  return null;
}

/**
 * Cria uma nova venda (status PENDENTE) com itens. Valida estoque antes de salvar.
 */
export async function createSellAction(
  _prev: SellFormState,
  formData: FormData
): Promise<SellFormState> {
  const client_id = Number(formData.get("client_id"));
  if (!client_id) return { error: "Cliente é obrigatório." };

  const items = parseItems(formData);
  if (items.length === 0) return { error: "Adicione ao menos um item à venda." };

  const supabase = await createClient();
  const stockError = await validateStock(supabase, items);
  if (stockError) return { error: stockError };

  const subtotals = items.map((i) => i.quantity * i.unitary_price);
  const subtotal = subtotals.reduce((a, b) => a + b, 0);
  const discount_value = Math.min(Math.max(parseNum(formData.get("discount_value")), 0), subtotal);
  const total_value = Math.max(0, subtotal - discount_value);

  const { data: sellData, error: errSell } = await supabase
    .from("sells")
    .insert({ client_id, total_value, discount_value, status: "PENDENTE" })
    .select("id")
    .single();

  if (errSell) return { error: errSell.message };

  const sellId = (sellData as { id: number }).id;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    await supabase.from("sell_items").insert({
      sell_id: sellId,
      product_id: item.product_id,
      quantity: item.quantity,
      unitary_price: item.unitary_price,
      subtotal: item.quantity * item.unitary_price,
    });
  }

  revalidatePath("/dashboard/vendas");
  redirect("/dashboard/vendas");
}

/**
 * Atualiza venda PENDENTE (cliente e itens). Valida estoque. Recalcula total.
 */
export async function updateSellAction(
  sellId: number,
  _prev: SellFormState,
  formData: FormData
): Promise<SellFormState> {
  const supabase = await createClient();
  const { data: sell } = await supabase.from("sells").select("status").eq("id", sellId).single();
  if (!sell || (sell as { status: SellStatus }).status !== "PENDENTE") {
    return { error: "Só é possível editar vendas com status PENDENTE." };
  }

  const client_id = Number(formData.get("client_id"));
  if (!client_id) return { error: "Cliente é obrigatório." };

  const items = parseItems(formData);
  if (items.length === 0) return { error: "Adicione ao menos um item à venda." };

  const stockError = await validateStock(supabase, items);
  if (stockError) return { error: stockError };

  const subtotal = items.reduce((acc, i) => acc + i.quantity * i.unitary_price, 0);
  const discount_value = Math.min(Math.max(parseNum(formData.get("discount_value")), 0), subtotal);
  const total_value = Math.max(0, subtotal - discount_value);

  await supabase.from("sells").update({ client_id, total_value, discount_value }).eq("id", sellId);
  await supabase.from("sell_items").delete().eq("sell_id", sellId);

  for (const item of items) {
    await supabase.from("sell_items").insert({
      sell_id: sellId,
      product_id: item.product_id,
      quantity: item.quantity,
      unitary_price: item.unitary_price,
      subtotal: item.quantity * item.unitary_price,
    });
  }

  revalidatePath("/dashboard/vendas");
  revalidatePath(`/dashboard/vendas/${sellId}/editar`);
  return {};
}

/**
 * Confirma a venda: baixa estoque, cria movimentações SAIDA/VENDA, status CONCLUIDA.
 */
export async function confirmSellAction(
  _prev: SellFormState,
  formData: FormData
): Promise<SellFormState> {
  const sellId = Number(formData.get("sell_id"));
  if (!sellId) return { error: "ID da venda não informado." };

  const supabase = await createClient();
  const { data: sell, error: errSell } = await supabase
    .from("sells")
    .select("id, status")
    .eq("id", sellId)
    .single();

  if (errSell || !sell) return { error: "Venda não encontrada." };
  if ((sell as { status: SellStatus }).status !== "PENDENTE") {
    return { error: "Apenas vendas PENDENTES podem ser confirmadas." };
  }

  const { data: items } = await supabase
    .from("sell_items")
    .select("product_id, quantity")
    .eq("sell_id", sellId);
  if (!items?.length) return { error: "Venda sem itens." };

  const stockError = await validateStock(supabase, items as { product_id: number; quantity: number }[]);
  if (stockError) return { error: stockError };

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

    await supabase.from("stock").update({ quantity: newQty }).eq("id", stockId);
    await supabase.from("stock_movements").insert({
      stock_id: stockId,
      movement_type: "SAIDA",
      reason: "VENDA",
      quantity: -item.quantity,
      quantity_before: qtyBefore,
      reference: `Venda #${sellId}`,
      user_id: userId,
    });
  }

  await supabase.from("sells").update({ status: "CONCLUIDA" }).eq("id", sellId);
  revalidatePath("/dashboard/vendas");
  revalidatePath(`/dashboard/vendas/${sellId}`);
  return {};
}

/**
 * Cancela a venda. Se CONCLUIDA, devolve estoque (ENTRADA, DEVOLUCAO_CLIENTE); status CANCELADA.
 */
export async function cancelSellAction(
  _prev: SellFormState,
  formData: FormData
): Promise<SellFormState> {
  const sellId = Number(formData.get("sell_id"));
  if (!sellId) return { error: "ID da venda não informado." };

  const supabase = await createClient();
  const { data: sell, error } = await supabase
    .from("sells")
    .select("id, status")
    .eq("id", sellId)
    .single();

  if (error || !sell) return { error: "Venda não encontrada." };
  const status = (sell as { status: SellStatus }).status;
  if (status === "CANCELADA") return { error: "Venda já está cancelada." };

  if (status === "CONCLUIDA") {
    const { data: items } = await supabase
      .from("sell_items")
      .select("product_id, quantity")
      .eq("sell_id", sellId);
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
        await supabase.from("stock").update({ quantity: qtyBefore + item.quantity }).eq("id", stockId);
        await supabase.from("stock_movements").insert({
          stock_id: stockId,
          movement_type: "ENTRADA",
          reason: "DEVOLUCAO_CLIENTE",
          quantity: item.quantity,
          quantity_before: qtyBefore,
          reference: `Cancelamento venda #${sellId}`,
          notes: "Devolução por cancelamento da venda",
          user_id: userId,
        });
      }
    }
  }

  await supabase.from("sells").update({ status: "CANCELADA" }).eq("id", sellId);
  revalidatePath("/dashboard/vendas");
  revalidatePath(`/dashboard/vendas/${sellId}`);
  return {};
}

/**
 * Wrapper para uso como form action: lê sell_id e sell_item_id do FormData.
 */
export async function removeSellItemFormAction(
  _prev: SellFormState,
  formData: FormData
): Promise<SellFormState> {
  const sellId = Number(formData.get("sell_id"));
  const sellItemId = Number(formData.get("sell_item_id"));
  if (!sellId || !sellItemId) return { error: "Dados do item não informados." };
  return removeSellItemAction(sellId, sellItemId);
}

/**
 * Remove um item da venda. Se venda CONCLUIDA, devolve estoque do item antes de remover.
 */
export async function removeSellItemAction(
  sellId: number,
  sellItemId: number
): Promise<SellFormState> {
  const supabase = await createClient();
  const { data: sell } = await supabase.from("sells").select("status").eq("id", sellId).single();
  if (!sell) return { error: "Venda não encontrada." };

  const { data: item } = await supabase
    .from("sell_items")
    .select("id, product_id, quantity")
    .eq("id", sellItemId)
    .eq("sell_id", sellId)
    .single();
  if (!item) return { error: "Item não encontrado." };

  const row = item as { id: number; product_id: number; quantity: number };
  const status = (sell as { status: SellStatus }).status;

  if (status === "CONCLUIDA") {
    const { data: stockRow } = await supabase
      .from("stock")
      .select("id, quantity")
      .eq("product_id", row.product_id)
      .single();
    if (stockRow) {
      const stockId = (stockRow as { id: number }).id;
      const qtyBefore = (stockRow as { quantity: number }).quantity;
      const userId = (await supabase.auth.getUser()).data.user?.id ?? null;
      await supabase.from("stock").update({ quantity: qtyBefore + row.quantity }).eq("id", stockId);
      await supabase.from("stock_movements").insert({
        stock_id: stockId,
        movement_type: "ENTRADA",
        reason: "DEVOLUCAO_CLIENTE",
        quantity: row.quantity,
        quantity_before: qtyBefore,
        reference: `Remoção item venda #${sellId}`,
        notes: "Item removido da venda",
        user_id: userId,
      });
    }
  }

  await supabase.from("sell_items").delete().eq("id", sellItemId);

  const { data: remaining } = await supabase
    .from("sell_items")
    .select("subtotal")
    .eq("sell_id", sellId);
  const subtotal = (remaining ?? []).reduce((acc, r) => acc + Number((r as { subtotal: number }).subtotal), 0);
  const { data: sellTotals } = await supabase
    .from("sells")
    .select("discount_value")
    .eq("id", sellId)
    .single();
  const currentDiscount = Number((sellTotals as { discount_value?: number } | null)?.discount_value ?? 0);
  const discount_value = Math.min(Math.max(currentDiscount, 0), subtotal);
  const newTotal = Math.max(0, subtotal - discount_value);
  await supabase.from("sells").update({ total_value: newTotal, discount_value }).eq("id", sellId);

  revalidatePath("/dashboard/vendas");
  revalidatePath(`/dashboard/vendas/${sellId}`);
  revalidatePath(`/dashboard/vendas/${sellId}/editar`);
  return {};
}

/**
 * Exclui venda e seus itens.
 * Regra: nao permite excluir venda CONCLUIDA para preservar consistencia de estoque.
 */
export async function deleteSellAction(
  _prev: SellFormState,
  formData: FormData
): Promise<SellFormState> {
  const sellId = Number(formData.get("sell_id"));
  if (!sellId) return { error: "ID da venda não informado." };

  const supabase = await createClient();
  const { data: sell, error } = await supabase
    .from("sells")
    .select("id, status")
    .eq("id", sellId)
    .single();

  if (error || !sell) return { error: "Venda não encontrada." };
  const status = (sell as { status: SellStatus }).status;

  if (status === "CONCLUIDA") {
    return {
      error:
        "Não é possível excluir venda CONCLUÍDA. Cancele a venda antes para devolver os itens ao estoque.",
    };
  }

  await supabase.from("sell_items").delete().eq("sell_id", sellId);
  const { error: deleteError } = await supabase.from("sells").delete().eq("id", sellId);
  if (deleteError) return { error: deleteError.message };

  revalidatePath("/dashboard/vendas");
  redirect("/dashboard/vendas");
}
