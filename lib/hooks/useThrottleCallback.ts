"use client";

import { useCallback, useRef } from "react";

/**
 * Retorna uma versão throttled (leading) do callback: executa na primeira chamada
 * e ignora chamadas subsequentes até passarem `ms` ms. Evita múltiplos cliques ou
 * requisições em curto espaço de tempo.
 *
 * @param callback - Função a ser throttled
 * @param ms - Intervalo mínimo em milissegundos entre execuções
 * @returns Função throttled
 */
export function useThrottleCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  ms: number
): T {
  const lastRun = useRef(0);

  const throttled = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRun.current >= ms || lastRun.current === 0) {
        lastRun.current = now;
        callback(...args);
      }
    },
    [callback, ms]
  ) as T;

  return throttled;
}
