"use client";

import { deleteLocationAction } from "@/actions/locations";
import { DeleteButton } from "@/components/ui/DeleteButton";

export function DeleteLocationButton({ id }: { id: number }) {
  return (
    <DeleteButton
      action={() => deleteLocationAction(id)}
      label="Excluir"
      confirmMessage="Tem certeza que deseja excluir esta localização? Produtos e transferências que usam este local manterão o nome, mas o cadastro será removido."
    />
  );
}
