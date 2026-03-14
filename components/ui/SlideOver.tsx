"use client";

import { useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";

const ANIMATION_MS = 200;

export interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Conteúdo do rodapé (ex.: botão Cancelar). Se não informado, não exibe rodapé. */
  footer?: React.ReactNode;
  /** Largura do painel: default (max-w-lg) ou wide (max-w-3xl), para conteúdo que precise de mais espaço (ex.: tabela de itens de venda). */
  contentWidth?: "default" | "wide";
}

/**
 * Sidebar que desliza da direita para a esquerda, com animação de entrada e saída.
 * Usado para formulários de adicionar/editar sem sair da página.
 */
export function SlideOver({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  contentWidth = "default",
}: SlideOverProps) {
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleClose() {
    if (isExiting) return;
    setIsExiting(true);
    exitTimeoutRef.current = setTimeout(() => {
      onClose();
      setIsExiting(false);
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
    }, ANIMATION_MS);
  }

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setHasAnimatedIn(false);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setHasAnimatedIn(true));
      });
      return () => cancelAnimationFrame(id);
    } else {
      document.body.style.overflow = "";
      setHasAnimatedIn(false);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
      document.body.style.overflow = "";
    };
  }, []);

  const visible = open || isExiting;
  const slideIn = open && hasAnimatedIn && !isExiting;

  if (!visible) return null;

  return (
    <>
      {/* Overlay com transição de opacidade */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 ease-out ${
          slideIn ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
        onClick={handleClose}
      />
      {/* Panel com transição de deslize */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-xl transition-transform duration-200 ease-out ${
          contentWidth === "wide" ? "max-w-3xl" : "max-w-lg"
        } ${slideIn ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="slideover-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-bmq-border px-6 py-4">
          <div>
            <h2
              id="slideover-title"
              className="text-lg font-semibold text-bmq-dark"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-bmq-mid-dark">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-bmq-mid-dark hover:bg-bmq-mid/20 hover:text-bmq-dark focus:outline-none focus:ring-2 focus:ring-bmq-accent"
            aria-label="Fechar"
          >
            <FiX size={22} />
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

        {/* Footer opcional */}
        {footer != null && (
          <div className="flex justify-end gap-3 border-t border-bmq-border px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
