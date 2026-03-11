"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Insertable, Updatable } from "@/types/database";

export type CategoryFormState = { error?: string };

function parseDecimal(value: FormDataEntryValue | null): number | null {
  if (value == null || value === "") return null;
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * Cria uma nova categoria.
 */
export async function createCategoryAction(
  _prev: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const price_default = parseDecimal(formData.get("price_default") as string | null);

  if (!name) {
    return { error: "Nome é obrigatório." };
  }

  const supabase = await createClient();
  const payload: Insertable<"categories"> = { name, description, price_default };

  // @ts-ignore Supabase client generic inference with custom Database type
  const { error } = await supabase.from("categories").insert(payload);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/categorias");
  redirect("/dashboard/categorias");
}

/**
 * Atualiza uma categoria existente.
 */
export async function updateCategoryAction(
  id: number,
  _prev: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const price_default = parseDecimal(formData.get("price_default") as string | null);

  if (!name) {
    return { error: "Nome é obrigatório." };
  }

  const supabase = await createClient();
  const payload: Updatable<"categories"> = { name, description, price_default };

  // @ts-ignore Supabase client generic inference with custom Database type
  const { error } = await supabase.from("categories").update(payload).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/categorias");
  revalidatePath(`/dashboard/categorias/${id}/editar`);
  redirect("/dashboard/categorias");
}

/**
 * Remove uma categoria.
 * Não redireciona para permitir Optimistic UI + router.refresh() no cliente.
 */
export async function deleteCategoryAction(id: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/categorias");
}
