"use client";

import { useRouter } from "next/navigation";
import { finalizeMonth } from "@/actions/monthly-closings";

interface FinalizarMesButtonProps {
  year: number;
  month: number;
  saldoResultante: number;
  disabled: boolean;
}

export function FinalizarMesButton({
  year,
  month,
  saldoResultante,
  disabled,
}: FinalizarMesButtonProps) {
  const router = useRouter();

  async function handleFinalize() {
    const res = await finalizeMonth(year, month, saldoResultante);
    if (res.ok) {
      router.refresh();
    } else {
      alert(res.error ?? "Erro ao finalizar mês.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleFinalize}
      disabled={disabled}
      className="text-sm text-bmq-mid-dark hover:text-bmq-dark hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:no-underline"
    >
      Finalizar mês
    </button>
  );
}
