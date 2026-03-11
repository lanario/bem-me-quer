"use client";

import { useFormState } from "react-dom";
import { cancelTransferAction } from "@/actions/transfers";

interface CancelTransferButtonProps {
  transferId: number;
  concluded?: boolean;
}

export function CancelTransferButton({ transferId, concluded }: CancelTransferButtonProps) {
  const [state, formAction] = useFormState(cancelTransferAction, {});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const msg = concluded
      ? "Esta transferência já foi concluída. Cancelar irá reverter a movimentação e a localização do estoque. Confirma?"
      : "Tem certeza que deseja cancelar esta transferência?";
    if (!confirm(msg)) e.preventDefault();
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="inline">
      <input type="hidden" name="transfer_id" value={transferId} />
      <button
        type="submit"
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        Cancelar
      </button>
      {state?.error && (
        <p className="text-xs text-red-600 mt-0.5" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
