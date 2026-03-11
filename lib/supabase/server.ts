import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

type CookieOption = { name: string; value: string; options?: Record<string, unknown> };

/**
 * Cliente Supabase para uso em Server Components e Server Actions.
 * Usa cookies para manter a sessão do usuário.
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  const client = await createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieOption[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Pode falhar em Middleware (read-only)
          }
        },
      },
    }
  );
  return client as unknown as SupabaseClient<Database>;
}
