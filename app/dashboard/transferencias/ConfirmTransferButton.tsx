"use client";

import { useFormState } from "react-dom";
import { confirmTransferAction } from "@/actions/transfers";

interface ConfirmTransferButtonProps {
  transferId: number;
}

export function ConfirmTransferButton({ transferId }: ConfirmTransferButtonProps) {
  const [state, formAction] = useFormState(confirmTransferAction, {});

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="transfer_id" value={transferId} />
      <button
        type="submit"
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50"
      >
        Confirmar
      </button>
      {state?.error && (
        <p className="text-xs text-red-600 mt-0.5" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
