"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Insertable, Updatable } from "@/types/database";

export type LocationFormState = { error?: string };

export async function createLocationAction(
  _prev: LocationFormState,
  formData: FormData
): Promise<LocationFormState> {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) {
    return { error: "Nome é obrigatório." };
  }

  const supabase = await createClient();
  const payload: Insertable<"locations"> = { name, description };

  const { error } = await supabase.from("locations").insert(payload);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/localizacoes");
  revalidatePath("/dashboard/transferencias");
  redirect("/dashboard/localizacoes");
}

export async function updateLocationAction(
  id: number,
  _prev: LocationFormState,
  formData: FormData
): Promise<LocationFormState> {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) {
    return { error: "Nome é obrigatório." };
  }

  const supabase = await createClient();
  const payload: Updatable<"locations"> = { name, description };

  const { error } = await supabase.from("locations").update(payload).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/localizacoes");
  revalidatePath("/dashboard/transferencias");
  redirect("/dashboard/localizacoes");
}

/**
 * Remove uma localização.
 * Não redireciona para permitir Optimistic UI + router.refresh() no cliente.
 */
export async function deleteLocationAction(id: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("locations").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/localizacoes");
  revalidatePath("/dashboard/transferencias");
}
