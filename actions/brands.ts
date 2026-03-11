"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Insertable, Updatable } from "@/types/database";

export type BrandFormState = { error?: string };

/**
 * Cria uma nova marca.
 */
export async function createBrandAction(
  _prev: BrandFormState,
  formData: FormData
): Promise<BrandFormState> {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) {
    return { error: "Nome é obrigatório." };
  }

  const supabase = await createClient();
  const payload: Insertable<"brands"> = { name, description };

  // @ts-ignore Supabase client generic inference with custom Database type
  const { error } = await supabase.from("brands").insert(payload);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/marcas");
  redirect("/dashboard/marcas");
}

/**
 * Atualiza uma marca existente.
 */
export async function updateBrandAction(
  id: number,
  _prev: BrandFormState,
  formData: FormData
): Promise<BrandFormState> {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) {
    return { error: "Nome é obrigatório." };
  }

  const supabase = await createClient();
  const payload: Updatable<"brands"> = { name, description };

  // @ts-ignore Supabase client generic inference with custom Database type
  const { error } = await supabase.from("brands").update(payload).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/marcas");
  revalidatePath(`/dashboard/marcas/${id}/editar`);
  redirect("/dashboard/marcas");
}

/**
 * Remove uma marca.
 * Não redireciona para permitir Optimistic UI + router.refresh() no cliente.
 */
export async function deleteBrandAction(id: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("brands").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/marcas");
}
