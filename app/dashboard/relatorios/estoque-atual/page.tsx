import { createClient } from "@/lib/supabase/server";
import { RelatoriosTabs } from "../RelatoriosTabs";
import { EstoqueFilters } from "../../estoque/EstoqueFilters";
import { ExportCsvButton } from "@/components/reports/ExportCsvButton";
import { ExportPdfButton } from "@/components/reports/ExportPdfButton";
import { getEstoqueAtualCsv } from "@/actions/reports";
import { getEstoqueAtualPdf } from "@/actions/reports-pdf";
import type { Tables } from "@/types/database";

type ProductEmbed = {
  title: string;
  barcode: string | null;
  brand_id: number;
  category_id: number;
  brands?: { name: string } | null;
  categories?: { name: string } | null;
};
type StockRow = Tables<"stock"> & { products?: ProductEmbed | null };

function getStatus(stock: StockRow): string {
  if (stock.quantity === 0) return "Sem estoque";
  if (stock.min_quantity > 0 && stock.quantity <= stock.min_quantity) return "Estoque baixo";
  return "OK";
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

export default async function RelatorioEstoqueAtualPage({
  searchParams,
}: {
  searchParams: Promise<{
    busca?: string;
    categoria?: string;
    marca?: string;
    status?: string;
    validade?: string;
  }>;
}) {
  const params = await searchParams;
  const { busca = "", categoria = "", marca = "", status = "", validade = "" } = params;
  const supabase = await createClient();

  const [brandsRes, categoriesRes, locationsRes, { data: rawData }] = await Promise.all([
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("locations").select("id, name").order("name"),
    supabase.from("stock").select("*, products(title, barcode, brand_id, category_id, brands(name), categories(name))").order("product_id"),
  ]);
  const brands = (brandsRes.data ?? []) as { id: number; name: string }[];
  const categories = (categoriesRes.data ?? []) as { id: number; name: string }[];
  const locations = (locationsRes.data ?? []) as { id: number; name: string }[];
  const locationsMap = new Map(locations.map((l) => [l.id, l.name]));
  const allStocks = (rawData ?? []) as StockRow[];

  let stocks = allStocks;
  const buscaLower = busca.trim().toLowerCase();
  if (buscaLower) {
    stocks = stocks.filter((s) => {
      const title = s.products?.title?.toLowerCase() ?? "";
      const barcode = s.products?.barcode?.toLowerCase() ?? "";
      const locName = locationsMap.get(s.location_id) ?? s.location ?? "";
      const loc = locName.toLowerCase();
      return title.includes(buscaLower) || barcode.includes(buscaLower) || loc.includes(buscaLower);
    });
  }
  if (categoria) stocks = stocks.filter((s) => String(s.products?.category_id) === categoria);
  if (marca) stocks = stocks.filter((s) => String(s.products?.brand_id) === marca);
  if (status === "out") stocks = stocks.filter((s) => s.quantity === 0);
  else if (status === "low") stocks = stocks.filter((s) => s.quantity > 0 && s.min_quantity > 0 && s.quantity <= s.min_quantity);
  else if (status === "ok") stocks = stocks.filter((s) => s.quantity > s.min_quantity || s.min_quantity === 0);
  const today = new Date();
  if (validade === "vencido") stocks = stocks.filter((s) => s.expiry_date && new Date(s.expiry_date) < today);
  else if (validade === "proximo") {
    const in30 = new Date(today);
    in30.setDate(in30.getDate() + 30);
    stocks = stocks.filter((s) => s.expiry_date && new Date(s.expiry_date) >= today && new Date(s.expiry_date) <= in30);
  } else if (validade === "valido") {
    const in30 = new Date(today);
    in30.setDate(in30.getDate() + 30);
    stocks = stocks.filter((s) => !s.expiry_date || new Date(s.expiry_date) > in30);
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-bmq-dark mb-2">Relatórios</h1>
      <p className="text-bmq-mid-dark mb-4">Visão financeira e operacional por período.</p>
      <RelatoriosTabs currentTab="estoque-atual" />
      <div className="flex justify-end gap-2 mb-6">
        <ExportCsvButton exportAction={getEstoqueAtualCsv} exportParams={params} label="Exportar CSV" />
        <ExportPdfButton exportAction={getEstoqueAtualPdf} exportParams={params} label="Exportar PDF" />
      </div>
      <h2 className="text-lg font-semibold text-bmq-dark mb-4">Estoque Atual</h2>
      <EstoqueFilters
        buscaDefault={busca}
        categoriaDefault={categoria}
        marcaDefault={marca}
        statusDefault={status}
        validadeDefault={validade}
        brands={brands}
        categories={categories}
        basePath="/dashboard/relatorios/estoque-atual"
      />
      <div className="mt-4 overflow-x-auto rounded-lg border border-bmq-border bg-white">
        <table className="min-w-full divide-y divide-bmq-border">
          <thead className="bg-bmq-bg">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Produto</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Marca</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Categoria</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-bmq-mid-dark">Qtd</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-bmq-mid-dark">Min</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Localização</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-bmq-mid-dark">Custo</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-bmq-mid-dark">Valor total</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Validade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bmq-border">
            {stocks.map((s) => {
              const totalValue = s.quantity * Number(s.cost_price);
              return (
                <tr key={s.id} className="hover:bg-bmq-mid/20">
                  <td className="px-4 py-3 text-sm font-medium text-bmq-dark">{s.products?.title ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-bmq-mid-dark">{s.products?.brands?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-bmq-mid-dark">{s.products?.categories?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-right text-bmq-dark">{s.quantity}</td>
                  <td className="px-4 py-3 text-sm text-right text-bmq-mid-dark">{s.min_quantity}</td>
                  <td className="px-4 py-3 text-sm text-bmq-mid-dark">{locationsMap.get(s.location_id) ?? s.location ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-right text-bmq-mid-dark">R$ {Number(s.cost_price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right text-bmq-dark">R$ {totalValue.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-bmq-mid-dark">{getStatus(s)}</td>
                  <td className="px-4 py-3 text-sm text-bmq-mid-dark">{formatDate(s.expiry_date)}</td>
                </tr>
              );
            })}
            {stocks.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-bmq-mid-dark">Nenhum registro.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
