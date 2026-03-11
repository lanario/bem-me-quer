"use client";

import { useFormState } from "react-dom";
import { receivePurchaseAction } from "@/actions/purchases";

interface ReceivePurchaseButtonProps {
  purchaseId: number;
}

export function ReceivePurchaseButton({ purchaseId }: ReceivePurchaseButtonProps) {
  const [state, formAction] = useFormState(receivePurchaseAction, {});

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="purchase_id" value={purchaseId} />
      <button
        type="submit"
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50"
      >
        Receber
      </button>
      {state?.error && (
        <p className="text-xs text-red-600 mt-0.5" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
