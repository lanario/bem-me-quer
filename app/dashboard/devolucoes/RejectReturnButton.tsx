"use client";

import { useFormState } from "react-dom";
import { rejectReturnAction } from "@/actions/returns";

interface RejectReturnButtonProps {
  returnId: number;
  wasApproved?: boolean;
}

export function RejectReturnButton({ returnId, wasApproved }: RejectReturnButtonProps) {
  const [state, formAction] = useFormState(rejectReturnAction, {});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const msg = wasApproved
      ? "Esta devolução foi aprovada. Rejeitar irá reverter a reposição no estoque. Confirma?"
      : "Tem certeza que deseja rejeitar esta devolução?";
    if (!confirm(msg)) e.preventDefault();
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="inline">
      <input type="hidden" name="return_id" value={returnId} />
      <button
        type="submit"
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        Rejeitar
      </button>
      {state?.error && (
        <p className="text-xs text-red-600 mt-0.5" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
