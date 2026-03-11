"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface PaginationBarProps {
  /** Total de itens */
  total: number;
  /** Itens por página */
  pageSize: number;
  /** Página atual (1-based) */
  currentPage: number;
  /** Base path para links (ex: /dashboard/clientes). Query string será preservada e page será adicionada/atualizada */
  basePath: string;
}

export function PaginationBar({
  total,
  pageSize,
  currentPage,
  basePath,
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());

  function buildUrl(page: number): string {
    const p = new URLSearchParams(searchParams.toString());
    if (page <= 1) p.delete("page");
    else p.set("page", String(page));
    const q = p.toString();
    return q ? `${basePath}?${q}` : basePath;
  }

  if (totalPages <= 1) return null;

  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-2 py-3 border-t border-bmq-border"
      aria-label="Paginação"
    >
      <p className="text-sm text-bmq-mid-dark">
        Mostrando <span className="font-medium">{start}</span> a <span className="font-medium">{end}</span> de{" "}
        <span className="font-medium">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        {prevPage ? (
          <Link
            href={buildUrl(prevPage)}
            className="inline-flex items-center gap-1 rounded-lg border border-bmq-border bg-white px-3 py-1.5 text-sm font-medium text-bmq-dark hover:bg-bmq-mid/20"
          >
            <FiChevronLeft size={18} />
            Anterior
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg border border-bmq-border bg-bmq-bg px-3 py-1.5 text-sm text-bmq-mid-dark/70 cursor-not-allowed">
            <FiChevronLeft size={18} />
            Anterior
          </span>
        )}
        <span className="text-sm text-bmq-mid-dark">
          Página {currentPage} de {totalPages}
        </span>
        {nextPage ? (
          <Link
            href={buildUrl(nextPage)}
            className="inline-flex items-center gap-1 rounded-lg border border-bmq-border bg-white px-3 py-1.5 text-sm font-medium text-bmq-dark hover:bg-bmq-mid/20"
          >
            Próxima
            <FiChevronRight size={18} />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg border border-bmq-border bg-bmq-bg px-3 py-1.5 text-sm text-bmq-mid-dark/70 cursor-not-allowed">
            Próxima
            <FiChevronRight size={18} />
          </span>
        )}
      </div>
    </nav>
  );
}
