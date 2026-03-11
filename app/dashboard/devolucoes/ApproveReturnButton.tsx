"use client";

import { useFormState } from "react-dom";
import { approveReturnAction } from "@/actions/returns";

interface ApproveReturnButtonProps {
  returnId: number;
}

export function ApproveReturnButton({ returnId }: ApproveReturnButtonProps) {
  const [state, formAction] = useFormState(approveReturnAction, {});

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="return_id" value={returnId} />
      <button
        type="submit"
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50"
      >
        Aprovar
      </button>
      {state?.error && (
        <p className="text-xs text-red-600 mt-0.5" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
