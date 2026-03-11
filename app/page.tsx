import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Página raiz: redireciona para /dashboard (se autenticado) ou /login.
 * O middleware também faz esse redirect; esta página é fallback para quando
 * o usuário acessa / diretamente após o middleware.
 */
export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }
  redirect("/login");
}
