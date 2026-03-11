"use client";

import { useFormState } from "react-dom";
import { cancelPurchaseAction } from "@/actions/purchases";

interface CancelPurchaseButtonProps {
  purchaseId: number;
  /** Se true, exibe aviso de reversão de estoque na confirmação */
  received?: boolean;
}

export function CancelPurchaseButton({ purchaseId, received }: CancelPurchaseButtonProps) {
  const [state, formAction] = useFormState(cancelPurchaseAction, {});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const msg = received
      ? "Esta compra já foi recebida. Cancelar irá reverter a entrada no estoque. Confirma?"
      : "Tem certeza que deseja cancelar esta compra?";
    if (!confirm(msg)) e.preventDefault();
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="inline">
      <input type="hidden" name="purchase_id" value={purchaseId} />
      <button
        type="submit"
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        Cancelar compra
      </button>
      {state?.error && (
        <p className="text-xs text-red-600 mt-0.5" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
