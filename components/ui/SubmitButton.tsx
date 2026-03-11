"use client";

import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Botão de submit que exibe estado de loading enquanto a form action está pendente.
 * Deve ser usado dentro de um <form> que possui action com useFormState.
 */
export function SubmitButton({
  children,
  loadingText = "Salvando…",
  className = "rounded-lg bg-bmq-accent px-4 py-2 text-sm font-medium text-white hover:bg-bmq-mid disabled:opacity-50 disabled:cursor-not-allowed",
  disabled = false,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} className={className}>
      {pending ? loadingText : children}
    </button>
  );
}
