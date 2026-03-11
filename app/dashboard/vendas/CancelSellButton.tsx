"use client";

import { useFormState } from "react-dom";
import { cancelSellAction } from "@/actions/sells";

interface CancelSellButtonProps {
  sellId: number;
  /** Se true, exibe aviso de devolução de estoque na confirmação */
  received?: boolean;
}

export function CancelSellButton({ sellId, received }: CancelSellButtonProps) {
  const [state, formAction] = useFormState(cancelSellAction, {});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const msg = received
      ? "Esta venda já foi concluída. Cancelar irá devolver os produtos ao estoque. Confirma?"
      : "Tem certeza que deseja cancelar esta venda?";
    if (!confirm(msg)) e.preventDefault();
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="inline">
      <input type="hidden" name="sell_id" value={sellId} />
      <button
        type="submit"
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        Cancelar venda
      </button>
      {state?.error && (
        <p className="text-xs text-red-600 mt-0.5" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
