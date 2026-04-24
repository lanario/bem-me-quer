"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiMenu } from "react-icons/fi";
import { Sidebar } from "@/components/dashboard/Sidebar";

const ROUTE_PREFIXES: { prefix: string; title: string }[] = [
  { prefix: "/dashboard/vendas", title: "Vendas" },
  { prefix: "/dashboard/compras", title: "Compras" },
  { prefix: "/dashboard/transferencias", title: "Transferências" },
  { prefix: "/dashboard/devolucoes", title: "Devoluções" },
  { prefix: "/dashboard/produtos", title: "Produtos" },
  { prefix: "/dashboard/estoque", title: "Estoque" },
  { prefix: "/dashboard/localizacoes", title: "Localizações" },
  { prefix: "/dashboard/movimentacoes", title: "Movimentações" },
  { prefix: "/dashboard/categorias", title: "Categorias" },
  { prefix: "/dashboard/marcas", title: "Marcas" },
  { prefix: "/dashboard/clientes", title: "Clientes" },
  { prefix: "/dashboard/perfil-bem-me-quer", title: "Perfil" },
  { prefix: "/dashboard/modelos-pdf", title: "Modelos de PDF" },
  { prefix: "/dashboard/relatorios", title: "Relatórios" },
  { prefix: "/dashboard", title: "Início" },
];

function getMobileTitle(pathname: string): string {
  if (/\/clientes\/\d+\/compras\/?$/.test(pathname)) {
    return "Compras do cliente";
  }
  for (const { prefix, title } of ROUTE_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return title;
    }
  }
  return "Painel";
}

interface DashboardShellProps {
  children: React.ReactNode;
}

/**
 * Layout do painel: sidebar fixa no desktop; no mobile, drawer com overlay e barra superior.
 */
export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pageTitle = getMobileTitle(pathname);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    function onMqChange(e: MediaQueryListEvent) {
      if (e.matches) setMobileNavOpen(false);
    }
    mq.addEventListener("change", onMqChange);
    return () => mq.removeEventListener("change", onMqChange);
  }, []);

  return (
    <div
      className="flex min-h-screen overflow-x-hidden bg-bmq-pageBg"
      style={{ backgroundColor: "var(--bmq-pageBg, #F4F8F4)" }}
    >
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-bmq-dark/30 backdrop-blur-[1px] lg:hidden"
          aria-label="Fechar menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <Sidebar
        mobileOpen={mobileNavOpen}
        onNavigate={() => setMobileNavOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-bmq-border bg-white/95 px-3 py-3 backdrop-blur-sm lg:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-bmq-border bg-white text-bmq-dark shadow-sm hover:bg-bmq-mid/10"
            aria-expanded={mobileNavOpen}
            aria-controls="dashboard-sidebar"
            aria-label="Abrir menu"
          >
            <FiMenu size={22} strokeWidth={2} />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-bmq-mid-dark">
              Bem Me Quer
            </p>
            <p className="truncate text-sm font-bold text-bmq-dark">{pageTitle}</p>
          </div>
          <Link
            href="/dashboard"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-bmq-border bg-white shadow-sm hover:bg-bmq-mid/10"
            aria-label="Ir para início"
          >
            <Image
              src="/logo_bmq_transp.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
          </Link>
        </header>

        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
