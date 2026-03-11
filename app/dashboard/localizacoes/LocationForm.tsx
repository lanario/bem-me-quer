"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import {
  createLocationAction,
  updateLocationAction,
  type LocationFormState,
} from "@/actions/locations";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { Tables } from "@/types/database";

interface LocationFormProps {
  location?: Tables<"locations"> | null;
  inSlideOver?: boolean;
}

export function LocationForm({ location, inSlideOver }: LocationFormProps) {
  const isEdit = Boolean(location?.id);
  const [state, formAction] = useFormState(
    isEdit
      ? (_prev: LocationFormState, formData: FormData) =>
          updateLocationAction(location!.id, {}, formData)
      : createLocationAction,
    {} as LocationFormState
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
          defaultValue={location?.name}
          placeholder="Ex: Prateleira A1, Loja"
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
          defaultValue={location?.description ?? ""}
          placeholder="Informações adicionais sobre o local"
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
            href="/dashboard/localizacoes"
            className="rounded-lg border border-bmq-border px-4 py-2 text-sm font-medium text-bmq-dark hover:bg-bmq-mid/20"
          >
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
