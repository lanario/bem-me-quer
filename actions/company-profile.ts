"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Tables } from "@/types/database";

/**
 * Obtém o perfil da empresa (linha única id=1).
 */
export async function getCompanyProfile(): Promise<Tables<"company_profile"> | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_profile")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) return null;
  return data as Tables<"company_profile">;
}

/**
 * Atualiza o perfil da empresa.
 */
export async function updateCompanyProfileAction(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const empresa = (formData.get("empresa") as string)?.trim() ?? "";
  const cnpj = (formData.get("cnpj") as string)?.trim() ?? "";
  const email = (formData.get("email") as string)?.trim() ?? "";
  const celular = (formData.get("celular") as string)?.trim() ?? "";
  const endereco = (formData.get("endereco") as string)?.trim() ?? "";
  const logo_url = (formData.get("logo_url") as string)?.trim() || null;

  if (!empresa) return { error: "Empresa é obrigatório." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("company_profile")
    .upsert(
      {
        id: 1,
        empresa,
        cnpj,
        email,
        celular,
        endereco,
        logo_url,
      },
      { onConflict: "id" }
    );

  if (error) return { error: error.message };

  revalidatePath("/dashboard/perfil-bem-me-quer");
  revalidatePath("/dashboard/vendas");
  return { success: true };
}
