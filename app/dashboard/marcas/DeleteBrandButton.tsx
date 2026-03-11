"use client";

import { deleteBrandAction } from "@/actions/brands";
import { DeleteButton } from "@/components/ui/DeleteButton";

export function DeleteBrandButton({ id }: { id: number }) {
  return (
    <DeleteButton
      action={() => deleteBrandAction(id)}
      label="Excluir"
      confirmMessage="Tem certeza que deseja excluir esta marca?"
    />
  );
}
