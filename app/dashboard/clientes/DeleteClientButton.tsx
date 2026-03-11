"use client";

import { deleteClientAction } from "@/actions/clients";
import { DeleteButton } from "@/components/ui/DeleteButton";

export function DeleteClientButton({ id }: { id: number }) {
  return (
    <DeleteButton
      action={() => deleteClientAction(id)}
      label="Excluir"
      confirmMessage="Tem certeza que deseja excluir este cliente?"
    />
  );
}
