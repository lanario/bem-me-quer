"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Insertable, Updatable } from "@/types/database";

export type ProductFormState = { error?: string };

function parseDecimal(value: FormDataEntryValue | null): number | null {
  if (value == null || value === "") return null;
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function parseOptionalInt(value: FormDataEntryValue | null): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Retorna o id da localização padrão (Principal) para novo estoque. */
async function getDefaultLocationId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<number | null> {
  const { data } = await supabase.from("locations").select("id").eq("name", "Principal").limit(1).single();
  if (data) return (data as { id: number }).id;
  const { data: first } = await supabase.from("locations").select("id").order("id", { ascending: true }).limit(1).single();
  return first ? (first as { id: number }).id : null;
}

/**
 * Cria um novo produto. Se track_stock for true, cria registro em stock.
 */
export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const sell_price = parseDecimal(formData.get("sell_price") as string | null);
  const cost_price_raw = parseDecimal(formData.get("cost_price") as string | null);
  const cost_price = cost_price_raw != null && cost_price_raw >= 0 ? cost_price_raw : 0;
  const brand_id = parseOptionalInt(formData.get("brand_id") as string | null);
  const category_id = parseOptionalInt(formData.get("category_id") as string | null);
  const track_stock = formData.get("track_stock") === "on";
  const min_quantity = Math.max(0, Math.floor(Number(formData.get("min_quantity")) || 0));
  const expiry_dateRaw = (formData.get("expiry_date") as string)?.trim() || null;
  const expiry_date = expiry_dateRaw && /^\d{4}-\d{2}-\d{2}$/.test(expiry_dateRaw) ? expiry_dateRaw : null;

  if (!title) {
    return { error: "Nome é obrigatório." };
  }
  if (sell_price == null || sell_price < 0) {
    return { error: "Preço de venda é obrigatório e deve ser um valor válido." };
  }
  if (cost_price_raw == null || cost_price_raw < 0) {
    return { error: "Preço de custo é obrigatório e deve ser um valor válido." };
  }

  const supabase = await createClient();

  const payload: Insertable<"products"> = {
    title,
    description,
    size: "M",
    color: "",
    sell_price,
    brand_id: brand_id ?? null,
    category_id: category_id ?? null,
    track_stock,
  };

  const { data: productData, error: errProduct } = await supabase
    .from("products")
    // @ts-ignore Supabase client generic inference with custom Database type
    .insert(payload)
    .select("id")
    .single();

  if (errProduct) {
    return { error: errProduct.message };
  }

  const product = productData as { id: number } | null;
  if (track_stock && product?.id) {
    const location_id = await getDefaultLocationId(supabase);
    if (location_id == null) {
      return { error: "Cadastre ao menos uma localização (ex: Principal) em Localizações." };
    }
    // @ts-ignore Supabase client generic inference with custom Database type
    await supabase.from("stock").insert({
      product_id: product.id,
      location_id,
      quantity: 0,
      min_quantity,
      cost_price,
      expiry_date,
    });
  }

  revalidatePath("/dashboard/produtos");
  redirect("/dashboard/produtos");
}

/**
 * Atualiza um produto. Se track_stock passar a true, cria stock se não existir.
 * Se passar a false, não remove o stock (apenas deixa de rastrear no fluxo de vendas).
 */
export async function updateProductAction(
  id: number,
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const sell_price = parseDecimal(formData.get("sell_price") as string | null);
  const cost_price_raw = parseDecimal(formData.get("cost_price") as string | null);
  const cost_price = cost_price_raw != null && cost_price_raw >= 0 ? cost_price_raw : 0;
  const brand_id = parseOptionalInt(formData.get("brand_id") as string | null);
  const category_id = parseOptionalInt(formData.get("category_id") as string | null);
  const track_stock = formData.get("track_stock") === "on";
  const min_quantity = Math.max(0, Math.floor(Number(formData.get("min_quantity")) || 0));
  const expiry_dateRaw = (formData.get("expiry_date") as string)?.trim() || null;
  const expiry_date = expiry_dateRaw && /^\d{4}-\d{2}-\d{2}$/.test(expiry_dateRaw) ? expiry_dateRaw : null;

  if (!title) {
    return { error: "Nome é obrigatório." };
  }
  if (sell_price == null || sell_price < 0) {
    return { error: "Preço de venda é obrigatório e deve ser um valor válido." };
  }
  if (cost_price_raw == null || cost_price_raw < 0) {
    return { error: "Preço de custo é obrigatório e deve ser um valor válido." };
  }

  const supabase = await createClient();

  const payload: Updatable<"products"> = {
    title,
    description,
    size: "M",
    color: "",
    sell_price,
    brand_id: brand_id ?? null,
    category_id: category_id ?? null,
    track_stock,
  };

  const { error: errProduct } = await supabase
    .from("products")
    // @ts-ignore Supabase client generic inference with custom Database type
    .update(payload)
    .eq("id", id);

  if (errProduct) {
    return { error: errProduct.message };
  }

  if (track_stock) {
    const { data: existingRows } = await supabase.from("stock").select("id, cost_price").eq("product_id", id);
    const rows = (existingRows ?? []) as { id: number; cost_price: number }[];
    if (rows.length === 0) {
      const location_id = await getDefaultLocationId(supabase);
      if (location_id != null) {
        // @ts-ignore Supabase client generic inference with custom Database type
        await supabase.from("stock").insert({
          product_id: id,
          location_id,
          quantity: 0,
          min_quantity,
          cost_price,
          expiry_date,
        });
      }
    } else {
      for (const row of rows) {
        // @ts-ignore Supabase client generic inference with custom Database type
        await supabase.from("stock").update({ cost_price, min_quantity, expiry_date }).eq("id", row.id);
      }
    }
  }

  revalidatePath("/dashboard/produtos");
  revalidatePath(`/dashboard/produtos/${id}/editar`);
  redirect("/dashboard/produtos");
}

/**
 * Atualiza um registro de estoque (por id). Um produto pode ter vários registros (um por localização).
 */
export async function updateStockAction(
  stockId: number,
  formData: FormData
): Promise<{ error?: string }> {
  const quantity = Math.max(0, Number(formData.get("quantity")) || 0);
  const min_quantity = Math.max(0, Number(formData.get("min_quantity")) || 0);
  const max_quantityRaw = formData.get("max_quantity");
  const max_quantity =
    max_quantityRaw !== null && max_quantityRaw !== ""
      ? Math.max(0, Number(max_quantityRaw))
      : null;
  const location = (formData.get("location") as string)?.trim() || null;
  const cost_price = Math.max(0, Number(formData.get("cost_price")) || 0);
  const batch_number = (formData.get("batch_number") as string)?.trim() || null;
  const expiry_dateRaw = (formData.get("expiry_date") as string)?.trim() || null;
  const expiry_date = expiry_dateRaw || null;

  const supabase = await createClient();

  const { data: stockData } = await supabase
    .from("stock")
    .select("id, product_id, cost_price")
    .eq("id", stockId)
    .single();

  const stockRow = stockData as { id: number; product_id: number; cost_price: number } | null;
  if (!stockRow) {
    return { error: "Registro de estoque não encontrado." };
  }

  const { error } = await supabase
    .from("stock")
    // @ts-ignore Supabase client generic inference with custom Database type
    .update({
      quantity,
      min_quantity,
      max_quantity,
      location,
      cost_price,
      batch_number,
      expiry_date,
    })
    .eq("id", stockId);
  if (error) return { error: error.message };
  if (Number(stockRow.cost_price) !== cost_price) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("price_history").insert({
      stock_id: stockId,
      cost_price,
      changed_by: user?.id ?? null,
      reason: "Atualização no cadastro",
    });
  }

  revalidatePath("/dashboard/produtos");
  revalidatePath(`/dashboard/produtos/${stockRow.product_id}/editar`);
  return {};
}

/**
 * Remove um produto (cascade remove stock).
 */
export async function deleteProductAction(id: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/produtos");
  redirect("/dashboard/produtos");
}
