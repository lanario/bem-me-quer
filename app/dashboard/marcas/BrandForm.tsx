"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import {
  createBrandAction,
  updateBrandAction,
  type BrandFormState,
} from "@/actions/brands";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { Tables } from "@/types/database";

interface BrandFormProps {
  brand?: Tables<"brands"> | null;
  inSlideOver?: boolean;
}

export function BrandForm({ brand, inSlideOver }: BrandFormProps) {
  const isEdit = Boolean(brand?.id);
  const [state, formAction] = useFormState(
    isEdit
      ? (_prev: BrandFormState, formData: FormData) =>
          updateBrandAction(brand!.id, {}, formData)
      : createBrandAction,
    {} as BrandFormState
  );

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-bmq-dark mb-1">
          Nome *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={100}
          defaultValue={brand?.name}
          className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent focus:border-bmq-accent"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-bmq-dark mb-1">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={brand?.description ?? ""}
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
            href="/dashboard/marcas"
            className="rounded-lg border border-bmq-border px-4 py-2 text-sm font-medium text-bmq-dark hover:bg-bmq-mid/20"
          >
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
