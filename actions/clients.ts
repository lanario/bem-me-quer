"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Insertable, Updatable } from "@/types/database";

export type ClientFormState = { error?: string };

/**
 * Cria um novo cliente.
 */
export async function createClientAction(
  _prev: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || "";
  const phone = (formData.get("phone") as string)?.trim() || "";
  const address = (formData.get("address") as string)?.trim() || null;

  if (!name) {
    return { error: "Nome é obrigatório." };
  }

  if (phone.length > 11) {
    return { error: "Telefone deve ter no máximo 11 caracteres." };
  }

  const supabase = await createClient();
  const payload: Insertable<"clients"> = { name, email, phone, address };

  // @ts-ignore Supabase client generic inference with custom Database type
  const { error } = await supabase.from("clients").insert(payload);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/clientes");
  redirect("/dashboard/clientes");
}

/**
 * Atualiza um cliente existente.
 */
export async function updateClientAction(
  id: number,
  _prev: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || "";
  const phone = (formData.get("phone") as string)?.trim() || "";
  const address = (formData.get("address") as string)?.trim() || null;

  if (!name) {
    return { error: "Nome é obrigatório." };
  }

  if (phone.length > 11) {
    return { error: "Telefone deve ter no máximo 11 caracteres." };
  }

  const supabase = await createClient();
  const payload: Updatable<"clients"> = { name, email, phone, address };

  // @ts-ignore Supabase client generic inference with custom Database type
  const { error } = await supabase.from("clients").update(payload).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/clientes");
  revalidatePath(`/dashboard/clientes/${id}/editar`);
  redirect("/dashboard/clientes");
}

/**
 * Remove um cliente.
 */
export async function deleteClientAction(id: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/clientes");
  redirect("/dashboard/clientes");
}
