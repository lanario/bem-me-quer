"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiEdit2 } from "react-icons/fi";
import { EstoqueFilters } from "./EstoqueFilters";
import { SlideOver } from "@/components/ui/SlideOver";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { AjustarEstoqueForm } from "./[id]/ajustar/AjustarEstoqueForm";
import type { Tables } from "@/types/database";

type ProductEmbed = {
  title: string;
  barcode: string | null;
  brand_id: number;
  category_id: number;
  brands?: { name: string } | null;
  categories?: { name: string } | null;
};
export type StockRow = Tables<"stock"> & { products?: ProductEmbed | null };

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

function getStatus(stock: StockRow): { label: string; className: string } {
  const qty = stock.quantity;
  const min = stock.min_quantity;
  if (qty === 0) return { label: "Sem estoque", className: "bg-red-100 text-red-800" };
  if (min > 0 && qty <= min) return { label: "Estoque baixo", className: "bg-amber-100 text-amber-800" };
  return { label: "OK", className: "bg-green-100 text-green-800" };
}

function getExpiryStatus(stock: StockRow): { label: string; className: string } | null {
  const d = stock.expiry_date;
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(d);
  expiry.setHours(0, 0, 0, 0);
  const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: "Vencido", className: "bg-red-100 text-red-800" };
  if (days <= 30) return { label: "Próximo", className: "bg-amber-100 text-amber-800" };
  return { label: "Válido", className: "bg-green-100 text-green-800" };
}

/** Mapa serializável id da localização → nome (ex.: { 1: "Loja Principal" }) */
type LocationNamesById = Record<number, string>;

interface EstoquePageClientProps {
  stocksPage: StockRow[];
  total: number;
  currentPage: number;
  basePath: string;
  busca: string;
  categoria: string;
  marca: string;
  status: string;
  validade: string;
  brands: { id: number; name: string }[];
  categories: { id: number; name: string }[];
  locationNamesById?: LocationNamesById;
}

export function EstoquePageClient({
  stocksPage,
  total,
  currentPage,
  basePath,
  busca,
  categoria,
  marca,
  status,
  validade,
  brands,
  categories,
  locationNamesById = {},
}: EstoquePageClientProps) {
  const router = useRouter();
  const [slideOpen, setSlideOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockRow | null>(null);

  function getLocationName(stock: StockRow): string {
    const id = stock.location_id;
    if (id != null && locationNamesById[id]) return locationNamesById[id];
    return stock.location ?? "—";
  }

  function openAjustar(stock: StockRow) {
    setSelectedStock(stock);
    setSlideOpen(true);
  }

  function closeSlide() {
    setSlideOpen(false);
    setSelectedStock(null);
  }

  return (
    <>
      <EstoqueFilters
        buscaDefault={busca}
        categoriaDefault={categoria}
        marcaDefault={marca}
        statusDefault={status}
        validadeDefault={validade}
        brands={brands}
        categories={categories}
      />

      <div className="mt-4 overflow-x-auto rounded-lg border border-bmq-border bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-bmq-bg">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Produto</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Qtd</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Min / Max</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Localização</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Custo</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Valor total</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Validade</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-bmq-mid-dark">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {stocksPage.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-bmq-mid-dark">
                  Nenhum registro de estoque encontrado.
                </td>
              </tr>
            ) : (
              stocksPage.map((s) => {
                const statusInfo = getStatus(s);
                const expiryInfo = getExpiryStatus(s);
                const totalValue = Number(s.quantity) * Number(s.cost_price);
                const productTitle = s.products?.title ?? "—";
                const brandName = s.products?.brands?.name ?? "—";
                const categoryName = s.products?.categories?.name ?? "—";
                return (
                  <tr key={s.id} className="hover:bg-bmq-mid/20">
                    <td className="px-4 py-3">
                      <div className="font-medium text-bmq-dark">{productTitle}</div>
                      <div className="text-xs text-bmq-mid-dark">{brandName} / {categoryName}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-bmq-dark">{s.quantity}</td>
                    <td className="px-4 py-3 text-sm text-bmq-mid-dark">{s.min_quantity} / {s.max_quantity ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-bmq-mid-dark">{getLocationName(s)}</td>
                    <td className="px-4 py-3 text-sm text-bmq-mid-dark">R$ {Number(s.cost_price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-bmq-dark">R$ {totalValue.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {expiryInfo ? (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${expiryInfo.className}`}>
                          {expiryInfo.label}
                        </span>
                      ) : (
                        "—"
                      )}
                      {s.expiry_date && <div className="text-xs text-bmq-mid-dark mt-0.5">{formatDate(s.expiry_date)}</div>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openAjustar(s)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-bmq-dark hover:bg-bmq-mid/30"
                      >
                        <FiEdit2 size={16} />
                        Ajustar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <PaginationBar
        total={total}
        pageSize={50}
        currentPage={currentPage}
        basePath={basePath}
      />

      <SlideOver
        open={slideOpen}
        onClose={closeSlide}
        title="Ajustar estoque"
        subtitle={selectedStock?.products?.title ?? undefined}
        footer={
          <button
            type="button"
            onClick={closeSlide}
            className="rounded-lg border border-bmq-border px-4 py-2 text-sm font-medium text-bmq-dark hover:bg-bmq-mid/20"
          >
            Cancelar
          </button>
        }
      >
        {selectedStock && (
          <>
            <div className="mb-6 rounded-lg border border-bmq-border bg-bmq-bg p-4">
              <p className="text-sm text-bmq-dark">
                <strong>Quantidade atual:</strong> {selectedStock.quantity}
                {selectedStock.min_quantity > 0 && <> · Min: {selectedStock.min_quantity}</>}
                {getLocationName(selectedStock) !== "—" && <> · Local: {getLocationName(selectedStock)}</>}
              </p>
            </div>
            <AjustarEstoqueForm
              stockId={selectedStock.id}
              currentQuantity={selectedStock.quantity}
              currentMinQuantity={selectedStock.min_quantity}
              inSlideOver
              onSuccess={() => {
                closeSlide();
                router.refresh();
              }}
            />
          </>
        )}
      </SlideOver>
    </>
  );
}
