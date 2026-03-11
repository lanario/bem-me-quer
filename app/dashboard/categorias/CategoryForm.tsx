"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import {
  createCategoryAction,
  updateCategoryAction,
  type CategoryFormState,
} from "@/actions/categories";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { Tables } from "@/types/database";

interface CategoryFormProps {
  category?: Tables<"categories"> | null;
  inSlideOver?: boolean;
}

export function CategoryForm({ category, inSlideOver }: CategoryFormProps) {
  const isEdit = Boolean(category?.id);
  const [state, formAction] = useFormState(
    isEdit
      ? (_prev: CategoryFormState, formData: FormData) =>
          updateCategoryAction(category!.id, {}, formData)
      : createCategoryAction,
    {} as CategoryFormState
  );

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nome *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={100}
          defaultValue={category?.name}
          className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent focus:border-bmq-accent"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={category?.description ?? ""}
          className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent focus:border-bmq-accent"
        />
      </div>
      <div>
        <label htmlFor="price_default" className="block text-sm font-medium text-gray-700 mb-1">
          Preço padrão (R$)
        </label>
        <input
          id="price_default"
          name="price_default"
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          defaultValue={
            category?.price_default != null
              ? String(category.price_default).replace(".", ",")
              : ""
          }
          className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent focus:border-bmq-accent"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}
      <div className="flex gap-3">
        <SubmitButton loadingText="Salvando…">
          {isEdit ? "Salvar" : "Criar"}
        </SubmitButton>
        {!inSlideOver && (
          <Link
            href="/dashboard/categorias"
            className="rounded-lg border border-bmq-border px-4 py-2 text-sm font-medium text-bmq-dark hover:bg-bmq-mid/20"
          >
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
