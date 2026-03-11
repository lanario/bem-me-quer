import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieOption = { name: string; value: string; options?: Record<string, unknown> };

/**
 * Middleware para renovar a sessão do Supabase e proteger rotas.
 * - Redireciona não autenticados de /dashboard/* para /login.
 * - Redireciona autenticados de /login para /dashboard.
 * - Redireciona / para /dashboard ou /login conforme sessão.
 */
export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieOption[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === "/login";
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isRoot = pathname === "/";

  /** Redireciona preservando os cookies da sessão (refresh). */
  function redirectTo(path: string) {
    const url = request.nextUrl.clone();
    url.pathname = path;
    const res = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      res.cookies.set(cookie.name, cookie.value);
    });
    return res;
  }

  if (isLoginPage && user) {
    return redirectTo("/dashboard");
  }

  if ((isDashboard || isRoot) && !user) {
    return redirectTo("/login");
  }

  if (isRoot && user) {
    return redirectTo("/dashboard");
  }

  return supabaseResponse;
}
