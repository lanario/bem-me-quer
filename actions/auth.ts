"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface LoginState {
  error?: string;
}

/**
 * Realiza login com email e senha via Supabase Auth.
 * Redireciona para /dashboard em caso de sucesso.
 */
export async function signIn(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;

  if (!email?.trim() || !password) {
    return { error: "Preencha e-mail e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

  if (error) {
    return { error: error.message === "Invalid login credentials" ? "E-mail ou senha inválidos." : error.message };
  }

  redirect("/dashboard");
}

/**
 * Realiza logout e redireciona para /login.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
