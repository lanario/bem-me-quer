"use client";

import { useFormState } from "react-dom";
import { FiTrash2 } from "react-icons/fi";
import { removeSellItemFormAction } from "@/actions/sells";

interface RemoveSellItemButtonProps {
  sellId: number;
  sellItemId: number;
}

export function RemoveSellItemButton({ sellId, sellItemId }: RemoveSellItemButtonProps) {
  const [state, formAction] = useFormState(removeSellItemFormAction, {});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!confirm("Remover este item da venda? Se a venda já foi concluída, o estoque será devolvido.")) {
      e.preventDefault();
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="inline">
      <input type="hidden" name="sell_id" value={sellId} />
      <input type="hidden" name="sell_item_id" value={sellItemId} />
      <button
        type="submit"
        className="p-1.5 text-gray-400 hover:text-red-600 rounded"
        title="Remover item"
      >
        <FiTrash2 size={18} />
      </button>
      {state?.error && (
        <p className="text-xs text-red-600 mt-0.5" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
