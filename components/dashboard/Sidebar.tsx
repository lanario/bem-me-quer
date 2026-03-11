"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiShoppingCart,
  FiPackage,
  FiTrendingUp,
  FiRepeat,
  FiShoppingBag,
  FiMapPin,
  FiGrid,
  FiTag,
  FiUsers,
  FiBarChart2,
  FiLogOut,
  FiTruck,
  FiCornerDownLeft,
} from "react-icons/fi";
import { signOut } from "@/actions/auth";
import { AnimatedIcon, type AnimatedIconName } from "@/components/ui/AnimatedIcon";

interface MenuItem {
  href: string;
  label: string;
  icon: typeof FiHome;
  animation: AnimatedIconName;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "Principal",
    items: [{ href: "/dashboard", label: "Início", icon: FiHome, animation: "bounce" }],
  },
  {
    title: "Vendas e operações",
    items: [
      { href: "/dashboard/vendas", label: "Vendas", icon: FiShoppingCart, animation: "cart-slide" },
      { href: "/dashboard/compras", label: "Compras", icon: FiShoppingBag, animation: "bounce" },
      { href: "/dashboard/transferencias", label: "Transferências", icon: FiTruck, animation: "truck-slide" },
      { href: "/dashboard/devolucoes", label: "Devoluções", icon: FiCornerDownLeft, animation: "arrows-slide" },
    ],
  },
  {
    title: "Produtos e estoque",
    items: [
      { href: "/dashboard/produtos", label: "Produtos", icon: FiPackage, animation: "box-jump" },
      { href: "/dashboard/estoque", label: "Estoque", icon: FiTrendingUp, animation: "box-jump" },
      { href: "/dashboard/localizacoes", label: "Localizações", icon: FiMapPin, animation: "bounce" },
      { href: "/dashboard/movimentacoes", label: "Movimentações", icon: FiRepeat, animation: "arrows-slide" },
      { href: "/dashboard/categorias", label: "Categorias", icon: FiGrid, animation: "bounce" },
      { href: "/dashboard/marcas", label: "Marcas", icon: FiTag, animation: "tag-sway" },
    ],
  },
  {
    title: "Cadastros",
    items: [{ href: "/dashboard/clientes", label: "Clientes", icon: FiUsers, animation: "bounce" }],
  },
  {
    title: "Análises",
    items: [{ href: "/dashboard/relatorios", label: "Relatórios", icon: FiBarChart2, animation: "bars-grow" }],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 h-screen sticky top-0 bg-white border-r border-bmq-border flex flex-col shrink-0">
      <div className="p-4 border-b border-bmq-border shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/logo_bmq_transp.png"
            alt="Bem Me Quer"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 object-contain"
          />
          <span className="text-xl font-bold text-bmq-dark">Bem Me Quer</span>
        </Link>
      </div>
      <nav className="flex-1 min-h-0 p-3 overflow-y-auto">
        {menuSections.map((section) => (
          <div key={section.title} className="mb-5 last:mb-0">
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon, animation }) => {
                const isActive =
                  pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? "bg-bmq-dark text-white [&>svg]:text-white"
                        : "text-gray-500 [&>svg]:text-gray-400 hover:text-bmq-dark hover:bg-bmq-mid/20 [&>svg]:group-hover:text-bmq-dark"
                    }`}
                  >
                    <AnimatedIcon Icon={Icon} animation={animation} inactive={isActive} size={20} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-bmq-border shrink-0">
        <form action={signOut}>
          <button
            type="submit"
            className="group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 [&>svg]:text-gray-400 hover:text-bmq-dark hover:bg-bmq-mid/20 [&>svg]:group-hover:text-bmq-dark transition-colors duration-200"
          >
            <AnimatedIcon Icon={FiLogOut} animation="arrows-slide" size={20} />
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
