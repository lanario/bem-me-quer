"use client";

import { useFormState } from "react-dom";
import Image from "next/image";
import { updateCompanyProfileAction } from "@/actions/company-profile";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { Tables } from "@/types/database";

interface CompanyProfileFormProps {
  profile: Tables<"company_profile"> | null;
}

const DEFAULTS = {
  empresa: "Bem me Quer",
  cnpj: "ABPl@7628",
  email: "bemequer.store2025@gmail.com",
  celular: "(21)966418522",
  endereco: "Rua Dona Teresa 156 - Vila Marines",
  logo_url: "",
};

export function CompanyProfileForm({ profile }: CompanyProfileFormProps) {
  const [state, formAction] = useFormState(
    async (_prev: { error?: string; success?: boolean }, formData: FormData) =>
      updateCompanyProfileAction(formData),
    {} as { error?: string; success?: boolean }
  );
  const p = profile ?? DEFAULTS;

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <div className="rounded-xl border border-bmq-border bg-white p-6">
        <h2 className="text-lg font-semibold text-bmq-dark mb-4">Dados da empresa</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="empresa" className="block text-sm font-medium text-bmq-dark mb-1">
              Empresa *
            </label>
            <input
              id="empresa"
              name="empresa"
              type="text"
              required
              defaultValue={p.empresa}
              className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent focus:border-bmq-accent"
            />
          </div>
          <div>
            <label htmlFor="cnpj" className="block text-sm font-medium text-bmq-dark mb-1">
              CNPJ
            </label>
            <input
              id="cnpj"
              name="cnpj"
              type="text"
              defaultValue={p.cnpj}
              className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent focus:border-bmq-accent"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-bmq-dark mb-1">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={p.email}
              className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent focus:border-bmq-accent"
            />
          </div>
          <div>
            <label htmlFor="celular" className="block text-sm font-medium text-bmq-dark mb-1">
              Celular
            </label>
            <input
              id="celular"
              name="celular"
              type="text"
              defaultValue={p.celular}
              className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent focus:border-bmq-accent"
            />
          </div>
          <div>
            <label htmlFor="endereco" className="block text-sm font-medium text-bmq-dark mb-1">
              Endereço
            </label>
            <input
              id="endereco"
              name="endereco"
              type="text"
              defaultValue={p.endereco}
              className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent focus:border-bmq-accent"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-bmq-border bg-white p-6">
        <h2 className="text-lg font-semibold text-bmq-dark mb-4">Logo</h2>
        <p className="text-sm text-bmq-mid-dark mb-3">
          URL da logo (deixe vazio para usar o logo padrão).
        </p>
        <input
          id="logo_url"
          name="logo_url"
          type="url"
          placeholder="https://..."
          defaultValue={p.logo_url ?? ""}
          className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent focus:border-bmq-accent"
        />
        {(p.logo_url || "/logo_bmq_transp.png") && (
          <div className="mt-3 relative w-24 h-24 rounded-lg border border-bmq-border overflow-hidden bg-bmq-mid/10">
            <Image
              src={p.logo_url || "/logo_bmq_transp.png"}
              alt="Logo"
              fill
              className="object-contain"
              sizes="96px"
              unoptimized={Boolean(p.logo_url && p.logo_url.startsWith("http"))}
            />
          </div>
        )}
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Perfil salvo com sucesso.
        </p>
      )}

      <SubmitButton loadingText="Salvando…">Salvar</SubmitButton>
    </form>
  );
}
