"use client";

import { deleteProductAction } from "@/actions/products";
import { DeleteButton } from "@/components/ui/DeleteButton";

export function DeleteProductButton({ id }: { id: number }) {
  return (
    <DeleteButton
      action={() => deleteProductAction(id)}
      label="Excluir"
      confirmMessage="Tem certeza que deseja excluir este produto? O estoque será removido."
    />
  );
}
