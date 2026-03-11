"use client";

import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";

interface DeleteButtonProps {
  action: () => void | Promise<void>;
  label?: string;
  confirmMessage?: string;
  className?: string;
}

/**
 * Botão que pede confirmação antes de executar a action (ex.: delete).
 * Suporta ações assíncronas; em caso de rejeição da Promise, o erro propaga
 * (fallback seguro: useOptimistic reverte e banco/tela não ficam dessincronizados).
 */
export function DeleteButton({
  action,
  label = "Excluir",
  confirmMessage = "Tem certeza que deseja excluir?",
  className = "",
}: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setIsPending(true);
    try {
      await action();
    } finally {
      setIsPending(false);
    }
  }

  const displayLabel = isPending
    ? "Excluindo..."
    : confirming
      ? "Clique de novo para confirmar"
      : label;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 focus:ring-2 focus:ring-red-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 ${className}`}
      title={confirming ? confirmMessage : label}
    >
      <FiTrash2 size={16} />
      {displayLabel}
    </button>
  );
}
