"use client";

import { useFormState } from "react-dom";
import { FiTrash2 } from "react-icons/fi";
import { deleteSellAction } from "@/actions/sells";

interface DeleteSellButtonProps {
  sellId: number;
}

export function DeleteSellButton({ sellId }: DeleteSellButtonProps) {
  const [state, formAction] = useFormState(deleteSellAction, {});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!confirm("Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.")) {
      e.preventDefault();
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="inline">
      <input type="hidden" name="sell_id" value={sellId} />
      <button
        type="submit"
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        <FiTrash2 size={15} />
        Excluir venda
      </button>
      {state?.error && (
        <p className="text-xs text-red-600 mt-0.5" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}

