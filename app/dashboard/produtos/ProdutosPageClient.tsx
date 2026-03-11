"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiPlus, FiEdit2, FiPackage, FiDollarSign, FiClipboard, FiFolder, FiChevronDown, FiChevronRight } from "react-icons/fi";
import { ProdutosFilters } from "./ProdutosFilters";
import { DeleteProductButton } from "./DeleteProductButton";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { SlideOver } from "@/components/ui/SlideOver";
import { ProductForm } from "./ProductForm";
import type { ProductSize, Tables } from "@/types/database";

const PAGE_SIZE = 20;

function ProductCard({
  product: p,
  buildUrl,
  SIZE_LABELS,
}: {
  product: ProductRow;
  buildUrl: (extra: { novo?: string; editar?: string }) => string;
  SIZE_LABELS: Record<ProductSize, string>;
}) {
  const sellPrice = p.sell_price != null ? Number(p.sell_price) : null;
  const costPrice = p.stock_cost_price != null ? Number(p.stock_cost_price) : null;
  const marginPct =
    sellPrice != null && costPrice != null && sellPrice > 0
      ? ((sellPrice - costPrice) / sellPrice) * 100
      : null;
  const validity =
    p.stock_expiry_date != null
      ? (() => {
          try {
            return new Date(p.stock_expiry_date!).toLocaleDateString("pt-BR");
          } catch {
            return "—";
          }
        })()
      : null;
  const categoryOrBrand = p.categories?.name ?? p.brands?.name ?? null;
  const qty = p.stock_quantity ?? 0;
  const minQty = p.stock_min_quantity ?? 0;

  return (
    <div
      className="rounded-card border border-bmq-border bg-white shadow-card p-5 transition-all duration-300 ease-out hover:scale-[1.015] hover:shadow-cardHover flex flex-col"
      style={{ backgroundColor: "var(--bmq-cardBg, #FFFFFF)" }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="rounded-lg bg-bmq-mid/20 p-2 shrink-0">
          <FiPackage className="text-bmq-dark" size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-bmq-dark truncate">{p.title}</h3>
          <p className="text-xs text-bmq-mid-dark mt-0.5">
            {SIZE_LABELS[p.size as ProductSize] ?? p.size}
          </p>
          {categoryOrBrand && (
            <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              {categoryOrBrand}
            </span>
          )}
        </div>
      </div>
      <div className="space-y-1.5 text-sm text-bmq-mid-dark mb-4">
        <div className="flex items-center gap-2">
          <FiDollarSign className="text-bmq-dark shrink-0" size={14} />
          <span>Venda: {sellPrice != null ? `R$ ${sellPrice.toFixed(2)}` : "—"}</span>
        </div>
        <div className="flex items-center gap-2">
          <FiDollarSign className="text-bmq-mid-dark shrink-0" size={14} />
          <span>Custo: {costPrice != null ? `R$ ${costPrice.toFixed(2)}` : "—"}</span>
        </div>
        <div className="flex items-center gap-2">
          <FiClipboard className="text-bmq-mid-dark shrink-0" size={14} />
          <span>Estoque: {qty} (mín: {minQty})</span>
        </div>
        {validity && (
          <div className="text-xs">
            Validade: {validity}
          </div>
        )}
        {marginPct != null && (
          <div className="text-xs font-medium text-bmq-dark">
            Margem: {marginPct.toFixed(1)}%
          </div>
        )}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-3 border-t border-bmq-border">
        {p.stock_id != null && (
          <Link
            href={`/dashboard/estoque/${p.stock_id}/ajustar`}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-bmq-mid-dark hover:bg-bmq-mid/20 border border-bmq-border"
          >
            <FiClipboard size={14} />
            Gerenciar estoque
          </Link>
        )}
        <Link
          href={buildUrl({ editar: String(p.id) })}
          className="inline-flex items-center gap-1 rounded-lg bg-bmq-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-bmq-mid"
        >
          <FiEdit2 size={14} />
          Editar
        </Link>
        <DeleteProductButton id={p.id} />
      </div>
    </div>
  );
}

const SIZE_LABELS: Record<ProductSize, string> = {
  S: "S",
  M: "M",
  L: "L",
  XL: "XL",
  XXL: "XXL",
  XXXL: "XXXL",
};

type ProductRow = Tables<"products"> & {
  brands?: { name: string };
  categories?: { name: string };
  stock_id?: number | null;
  stock_cost_price?: number;
  stock_expiry_date?: string | null;
  stock_quantity?: number;
  stock_min_quantity?: number;
};

type ProductGroup = { key: string; label: string; products: ProductRow[] };

interface ProdutosPageClientProps {
  products: ProductRow[];
  total: number;
  currentPage: number;
  busca: string;
  marca: string;
  categoria: string;
  tamanho: string;
  brands: { id: number; name: string }[];
  categories: { id: number; name: string }[];
  productToEdit: Tables<"products"> | null;
  /** Preço de custo do estoque ao editar (slide-over). */
  initialCostPriceForEdit?: number | null;
  /** Estoque mínimo do estoque ao editar (slide-over). */
  initialMinQuantityForEdit?: number | null;
  /** Validade do estoque ao editar (slide-over). */
  initialExpiryDateForEdit?: string | null;
  openNew: boolean;
  editId: string | null;
}

export function ProdutosPageClient({
  products,
  total,
  currentPage,
  busca,
  marca,
  categoria,
  tamanho,
  brands,
  categories,
  productToEdit,
  initialCostPriceForEdit,
  initialMinQuantityForEdit,
  initialExpiryDateForEdit,
  openNew,
  editId,
}: ProdutosPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOpen = openNew || Boolean(editId);

  const groups = useMemo(() => {
    const map = new Map<string, ProductGroup>();
    for (const p of products) {
      const key = p.category_id != null ? String(p.category_id) : "sem_categoria";
      const label = p.categories?.name ?? "Sem categoria";
      if (!map.has(key)) map.set(key, { key, label, products: [] });
      map.get(key)!.products.push(p);
    }
    const list = Array.from(map.values());
    list.sort((a, b) => {
      if (a.key === "sem_categoria") return -1;
      if (b.key === "sem_categoria") return 1;
      return a.label.localeCompare(b.label);
    });
    return list;
  }, [products]);

  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(() => new Set());

  function toggleGroup(key: string) {
    setCollapsedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function buildUrl(extra: { novo?: string; editar?: string }) {
    const p = new URLSearchParams(searchParams.toString());
    if (extra.novo != null) p.set("novo", extra.novo);
    if (extra.editar != null) p.set("editar", extra.editar);
    const q = p.toString();
    return q ? `/dashboard/produtos?${q}` : "/dashboard/produtos";
  }

  function closeSlideOver() {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("novo");
    p.delete("editar");
    const q = p.toString();
    router.push(q ? `/dashboard/produtos?${q}` : "/dashboard/produtos");
  }

  return (
    <>
      <div className="p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-bmq-dark">Produtos</h1>
          <Link
            href={buildUrl({ novo: "1" })}
            className="inline-flex items-center gap-2 rounded-lg bg-bmq-accent px-4 py-2 text-sm font-medium text-white hover:bg-bmq-mid"
          >
            <FiPlus size={18} />
            Novo produto
          </Link>
        </div>

        <ProdutosFilters
          buscaDefault={busca}
          marcaDefault={marca}
          categoriaDefault={categoria}
          tamanhoDefault={tamanho}
          brands={brands}
          categories={categories}
        />

        <div className="mt-6 space-y-4">
          {products.length === 0 ? (
            <div className="rounded-card border border-bmq-border bg-white shadow-card py-12 text-center text-bmq-mid-dark">
              Nenhum produto encontrado.
            </div>
          ) : (
            groups.map((group) => {
              const isExpanded = !collapsedKeys.has(group.key);
              return (
                <div
                  key={group.key}
                  className="rounded-card border border-bmq-border bg-white shadow-card overflow-hidden"
                  style={{ backgroundColor: "var(--bmq-cardBg, #FFFFFF)" }}
                >
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bmq-mid/10 transition-colors border-b border-bmq-border"
                  >
                    {isExpanded ? (
                      <FiChevronDown className="text-bmq-mid-dark shrink-0" size={20} />
                    ) : (
                      <FiChevronRight className="text-bmq-mid-dark shrink-0" size={20} />
                    )}
                    <FiFolder className="text-bmq-accent shrink-0" size={22} />
                    <span className="font-semibold text-bmq-dark">{group.label}</span>
                    <span className="text-sm text-bmq-mid-dark">({group.products.length})</span>
                  </button>
                  {isExpanded && (
                    <div className="p-4 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {group.products.map((p) => (
                          <ProductCard
                            key={p.id}
                            product={p}
                            buildUrl={buildUrl}
                            SIZE_LABELS={SIZE_LABELS}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        <PaginationBar
          total={total}
          pageSize={PAGE_SIZE}
          currentPage={currentPage}
          basePath="/dashboard/produtos"
        />
      </div>

      <SlideOver
        open={isOpen}
        onClose={closeSlideOver}
        title={editId ? "Editar produto" : "Novo produto"}
        contentWidth="wide"
        subtitle={
          editId
            ? "Altere os dados do produto."
            : "Cadastre um novo produto no estoque."
        }
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
        <ProductForm
          product={openNew ? undefined : productToEdit ?? undefined}
          initialCostPrice={openNew ? undefined : initialCostPriceForEdit ?? undefined}
          initialMinQuantity={openNew ? undefined : initialMinQuantityForEdit ?? undefined}
          initialExpiryDate={openNew ? undefined : initialExpiryDateForEdit ?? undefined}
          brands={brands}
          categories={categories}
          inSlideOver
        />
      </SlideOver>
    </>
  );
}
