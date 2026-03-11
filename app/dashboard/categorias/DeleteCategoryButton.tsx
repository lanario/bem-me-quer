"use client";

import { deleteCategoryAction } from "@/actions/categories";
import { DeleteButton } from "@/components/ui/DeleteButton";

export function DeleteCategoryButton({ id }: { id: number }) {
  return (
    <DeleteButton
      action={() => deleteCategoryAction(id)}
      label="Excluir"
      confirmMessage="Tem certeza que deseja excluir esta categoria?"
    />
  );
}
