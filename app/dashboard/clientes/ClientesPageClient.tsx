"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiPlus, FiEdit2, FiUser, FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import { ClientesListSearch } from "./ClientesListSearch";
import { DeleteClientButton } from "./DeleteClientButton";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { SlideOver } from "@/components/ui/SlideOver";
import { ClientForm } from "./ClientForm";
import type { Tables } from "@/types/database";

const PAGE_SIZE = 20;

type ClientRow = Tables<"clients">;

function ClientCard({
  client,
  buildUrl,
}: {
  client: ClientRow;
  buildUrl: (extra: { novo?: string; editar?: string }) => string;
}) {
  return (
    <div
      className="rounded-card border border-bmq-border bg-white shadow-card p-5 transition-all duration-300 ease-out hover:scale-[1.015] hover:shadow-cardHover flex flex-col"
      style={{ backgroundColor: "var(--bmq-cardBg, #FFFFFF)" }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="rounded-lg bg-bmq-mid/20 p-2 shrink-0">
          <FiUser className="text-bmq-dark" size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-bmq-dark truncate">{client.name}</h3>
        </div>
      </div>
      <div className="space-y-1.5 text-sm text-bmq-mid-dark mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <FiMail className="text-bmq-dark shrink-0" size={14} />
          <span className="truncate">{client.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <FiPhone className="text-bmq-mid-dark shrink-0" size={14} />
          <span>{client.phone || "—"}</span>
        </div>
        <div className="flex items-start gap-2 min-w-0">
          <FiMapPin className="text-bmq-mid-dark shrink-0 mt-0.5" size={14} />
          <span className="truncate line-clamp-2">{client.address || "—"}</span>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-3 border-t border-bmq-border">
        <Link
          href={buildUrl({ editar: String(client.id) })}
          className="inline-flex items-center gap-1 rounded-lg bg-bmq-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-bmq-mid"
        >
          <FiEdit2 size={14} />
          Editar
        </Link>
        <DeleteClientButton id={client.id} />
      </div>
    </div>
  );
}

interface ClientesPageClientProps {
  clients: ClientRow[];
  total: number;
  currentPage: number;
  busca: string;
  ordem: string;
  /** Cliente em edição (quando editar=id na URL). */
  clientToEdit: ClientRow | null;
  /** Sidebar de novo aberta (novo=1). */
  openNew: boolean;
  /** ID em edição (editar=id). */
  editId: string | null;
}

export function ClientesPageClient({
  clients,
  total,
  currentPage,
  busca,
  ordem,
  clientToEdit,
  openNew,
  editId,
}: ClientesPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOpen = openNew || Boolean(editId);

  function buildUrl(extra: { novo?: string; editar?: string }) {
    const p = new URLSearchParams(searchParams.toString());
    if (extra.novo != null) p.set("novo", extra.novo);
    if (extra.editar != null) p.set("editar", extra.editar);
    const q = p.toString();
    return q ? `/dashboard/clientes?${q}` : "/dashboard/clientes";
  }

  function closeSlideOver() {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("novo");
    p.delete("editar");
    const q = p.toString();
    router.push(q ? `/dashboard/clientes?${q}` : "/dashboard/clientes");
  }

  return (
    <>
      <div className="p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-bmq-dark">Clientes</h1>
          <Link
            href={buildUrl({ novo: "1" })}
            className="inline-flex items-center gap-2 rounded-lg bg-bmq-accent px-4 py-2 text-sm font-medium text-white hover:bg-bmq-mid"
          >
            <FiPlus size={18} />
            Novo cliente
          </Link>
        </div>

        <ClientesListSearch defaultValue={busca} orderDefault={ordem} />

        <div className="mt-6">
          {clients.length === 0 ? (
            <div className="rounded-card border border-bmq-border bg-white shadow-card py-12 text-center text-bmq-mid-dark">
              Nenhum cliente encontrado.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {clients.map((c) => (
                <ClientCard key={c.id} client={c} buildUrl={buildUrl} />
              ))}
            </div>
          )}
        </div>
        <PaginationBar
          total={total}
          pageSize={PAGE_SIZE}
          currentPage={currentPage}
          basePath="/dashboard/clientes"
        />
      </div>

      <SlideOver
        open={isOpen}
        onClose={closeSlideOver}
        title={editId ? "Editar cliente" : "Novo cliente"}
        subtitle={editId ? "Altere os dados do cliente." : "Adicione um novo cliente."}
        footer={
          <button
            type="button"
            onClick={closeSlideOver}
            className="rounded-lg border border-bmq-border px-4 py-2 text-sm font-medium text-bmq-dark hover:bg-bmq-mid/20"
          >
            Cancelar
          </button>
        }
      >
        <ClientForm
          client={openNew ? undefined : clientToEdit ?? undefined}
          inSlideOver
        />
      </SlideOver>
    </>
  );
}
