"use client";

import { useFormState } from "react-dom";
import { signIn } from "@/actions/auth";
import { FiMail, FiLock } from "react-icons/fi";

export default function LoginPage() {
  const [state, formAction] = useFormState(signIn, {});

  return (
    <main className="min-h-screen flex items-center justify-center bg-bmq-bg px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl shadow-md border border-bmq-border p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-bmq-dark">Bem Me Quer</h1>
            <p className="mt-1 text-sm text-bmq-mid-dark">Gerenciamento de estoque</p>
          </div>

          <form action={formAction} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-bmq-dark mb-1">
                E-mail
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bmq-mid-dark">
                  <FiMail size={18} />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-3 py-2 border border-bmq-border rounded-lg text-bmq-dark placeholder:text-bmq-placeholder focus:ring-2 focus:ring-bmq-accent focus:border-bmq-accent outline-none transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-bmq-dark mb-1">
                Senha
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bmq-mid-dark">
                  <FiLock size={18} />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2 border border-bmq-border rounded-lg text-bmq-dark placeholder:text-bmq-placeholder focus:ring-2 focus:ring-bmq-accent focus:border-bmq-accent outline-none transition"
                />
              </div>
            </div>

            {state?.error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-bmq-accent hover:bg-bmq-mid text-white font-medium rounded-lg focus:ring-2 focus:ring-bmq-accent focus:ring-offset-2 transition"
            >
              Entrar
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-bmq-mid-dark">
          Use sua conta Supabase (Auth) para acessar.
        </p>
      </div>
    </main>
  );
}
