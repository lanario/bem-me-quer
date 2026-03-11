"use client";

import { useFormState } from "react-dom";
import { confirmSellAction } from "@/actions/sells";

interface ConfirmSellButtonProps {
  sellId: number;
}

export function ConfirmSellButton({ sellId }: ConfirmSellButtonProps) {
  const [state, formAction] = useFormState(confirmSellAction, {});

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="sell_id" value={sellId} />
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
