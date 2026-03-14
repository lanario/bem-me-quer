"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import {
  createProductAction,
  updateProductAction,
  type ProductFormState,
} from "@/actions/products";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { Tables } from "@/types/database";

interface ProductFormProps {
  product?: Tables<"products"> | null;
  /** Preço de custo inicial (vindo do stock na edição). */
  initialCostPrice?: number | null;
  /** Estoque mínimo inicial (vindo do stock na edição). */
  initialMinQuantity?: number | null;
  /** Validade inicial (vindo do stock na edição). */
  initialExpiryDate?: string | null;
  brands: { id: number; name: string }[];
  categories: { id: number; name: string }[];
  inSlideOver?: boolean;
}

export function ProductForm({ product, initialCostPrice, initialMinQuantity, initialExpiryDate, brands, categories, inSlideOver }: ProductFormProps) {
  const isEdit = Boolean(product?.id);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [state, formAction] = useFormState(
    isEdit
      ? (_prev: ProductFormState, formData: FormData) =>
          updateProductAction(product!.id, {}, formData)
      : createProductAction,
    {} as ProductFormState
  );

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  const currentImageUrl = previewUrl ?? (product?.image_url ?? null);

  return (
    <form action={formAction} className="max-w-xl space-y-4" encType="multipart/form-data">
      <div>
        <label className="block text-sm font-medium text-bmq-dark mb-1">
          Imagem do produto
        </label>
        <p className="text-xs text-bmq-mid-dark mb-2">
          JPG, PNG ou WebP. Máx. 2 MB.
        </p>
        <div className="flex items-start gap-4">
          {currentImageUrl && (
            <div className="relative w-24 h-24 rounded-lg border border-bmq-border overflow-hidden bg-bmq-mid/10 shrink-0">
              <Image
                src={currentImageUrl}
                alt="Preview"
                fill
                className="object-cover"
                sizes="96px"
                unoptimized={currentImageUrl.startsWith("https://") && currentImageUrl.includes("supabase")}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <input
              id="image"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="w-full text-sm text-bmq-dark file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-bmq-accent file:text-white hover:file:bg-bmq-mid"
            />
          </div>
        </div>
      </div>
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-bmq-dark mb-1">
          Nome *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={100}
          defaultValue={product?.title}
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
          rows={2}
          defaultValue={product?.description ?? ""}
          className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent focus:border-bmq-accent"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="cost_price" className="block text-sm font-medium text-bmq-dark mb-1">
            Preço de custo (R$) *
          </label>
          <input
            id="cost_price"
            name="cost_price"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            required
            defaultValue={
              initialCostPrice != null && Number.isFinite(initialCostPrice)
                ? String(initialCostPrice).replace(".", ",")
                : ""
            }
            className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent"
          />
        </div>
        <div>
          <label htmlFor="sell_price" className="block text-sm font-medium text-bmq-dark mb-1">
            Preço de venda (R$) *
          </label>
          <input
            id="sell_price"
            name="sell_price"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            required
            defaultValue={
              product?.sell_price != null
                ? String(product.sell_price).replace(".", ",")
                : ""
            }
            className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="brand_id" className="block text-sm font-medium text-bmq-dark mb-1">
            Marca
          </label>
          <select
            id="brand_id"
            name="brand_id"
            defaultValue={product?.brand_id ?? ""}
            className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent"
          >
            <option value="">Selecione</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-bmq-dark mb-1">
            Categoria
          </label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={product?.category_id ?? ""}
            className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent"
          >
            <option value="">Selecione</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="track_stock"
          name="track_stock"
          type="checkbox"
          defaultChecked={product?.track_stock ?? true}
          className="rounded border-bmq-border text-bmq-mid-dark focus:ring-bmq-accent"
        />
        <label htmlFor="track_stock" className="text-sm font-medium text-bmq-dark">
          Rastrear estoque
        </label>
      </div>
      <div>
        <label htmlFor="min_quantity" className="block text-sm font-medium text-bmq-dark mb-1">
          Estoque mínimo
        </label>
        <input
          id="min_quantity"
          name="min_quantity"
          type="number"
          min={0}
          defaultValue={
            isEdit && initialMinQuantity != null && Number.isFinite(initialMinQuantity)
              ? initialMinQuantity
              : 0
          }
          className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent"
        />
        <p className="mt-0.5 text-xs text-bmq-mid-dark">Quando a quantidade atingir este valor, o sistema marcará como estoque baixo.</p>
      </div>
      <div>
        <label htmlFor="expiry_date" className="block text-sm font-medium text-bmq-dark mb-1">
          Validade (opcional)
        </label>
        <input
          id="expiry_date"
          name="expiry_date"
          type="date"
          defaultValue={initialExpiryDate ?? ""}
          className="w-full rounded-lg border border-bmq-border px-3 py-2 focus:ring-2 focus:ring-bmq-accent focus:border-bmq-accent"
        />
        <p className="mt-0.5 text-xs text-bmq-mid-dark">Data de validade do produto ou do lote em estoque.</p>
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
            href="/dashboard/produtos"
            className="rounded-lg border border-bmq-border px-4 py-2 text-sm font-medium text-bmq-dark hover:bg-bmq-mid/20"
          >
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
