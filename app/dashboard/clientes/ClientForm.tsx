"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import {
  createClientAction,
  updateClientAction,
  type ClientFormState,
} from "@/actions/clients";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { Tables } from "@/types/database";

interface ClientFormProps {
  client?: Tables<"clients"> | null;
  /** Quando true, não exibe o link Cancelar (usado dentro do SlideOver). */
  inSlideOver?: boolean;
}

export function ClientForm({ client, inSlideOver }: ClientFormProps) {
  const isEdit = Boolean(client?.id);
  const [state, formAction] = useFormState(
    isEdit
      ? (_prev: ClientFormState, formData: FormData) =>
          updateClientAction(client!.id, {}, formData)
      : createClientAction,
    {} as ClientFormState
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
          defaultValue={client?.name}
          className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent focus:border-bmq-accent"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          maxLength={254}
          defaultValue={client?.email}
          className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent focus:border-bmq-accent"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Telefone (máx. 11)
        </label>
        <input
          id="phone"
          name="phone"
          type="text"
          maxLength={11}
          defaultValue={client?.phone}
          className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent focus:border-bmq-accent"
        />
      </div>
      <div>
        <label
          htmlFor="birth_date"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Data de nascimento
        </label>
        <input
          id="birth_date"
          name="birth_date"
          type="date"
          defaultValue={client?.birth_date?.slice(0, 10) ?? ""}
          className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent focus:border-bmq-accent"
        />
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Endereço
        </label>
        <textarea
          id="address"
          name="address"
          rows={2}
          defaultValue={client?.address ?? ""}
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
            href="/dashboard/clientes"
            className="rounded-lg border border-bmq-border px-4 py-2 text-sm font-medium text-bmq-dark hover:bg-bmq-mid/20"
          >
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
