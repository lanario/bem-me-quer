"use client";

import type { IconType } from "react-icons";

/**
 * Nomes das micro-interações disponíveis (mesmo comportamento em todo o sistema).
 * Use no sidebar, botões, cabeçalhos de tabela e cards.
 */
export type AnimatedIconName =
  | "cart-slide"
  | "tag-sway"
  | "box-jump"
  | "arrows-slide"
  | "bars-grow"
  | "bounce"
  | "truck-slide"
  | "none";

const HOVER_ANIMATION_CLASS: Record<Exclude<AnimatedIconName, "none">, string> = {
  "cart-slide": "group-hover:animate-icon-cart-slide",
  "tag-sway": "group-hover:animate-icon-tag-sway",
  "box-jump": "group-hover:animate-icon-box-jump",
  "arrows-slide": "group-hover:animate-icon-arrows-slide",
  "bars-grow": "origin-bottom group-hover:animate-icon-bars-grow",
  "bounce": "group-hover:animate-icon-bounce",
  "truck-slide": "group-hover:animate-icon-truck-slide",
};

export interface AnimatedIconProps {
  /** Ícone do react-icons (ex: FiShoppingCart). */
  Icon: IconType;
  /** Nome da micro-interação ao hover (o pai deve ter className "group"). */
  animation: AnimatedIconName;
  /** Desativar animação (ex.: item ativo na sidebar). */
  inactive?: boolean;
  size?: number;
  className?: string;
}

/**
 * Ícone com micro-interação padronizada. O elemento pai deve ter a classe "group"
 * para que a animação dispare ao passar o mouse no pai (botão, link, card, etc.).
 * Usar em todo o sistema: sidebar, botões de ação, cabeçalhos, cards.
 */
export function AnimatedIcon({
  Icon,
  animation,
  inactive = false,
  size = 20,
  className = "",
}: AnimatedIconProps) {
  const hoverClass =
    !inactive && animation !== "none" ? HOVER_ANIMATION_CLASS[animation as Exclude<AnimatedIconName, "none">] : "";
  return <Icon size={size} className={`shrink-0 inline-block ${hoverClass} ${className}`.trim()} />;
}
