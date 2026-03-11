import { createClient } from "@/lib/supabase/server";
import { RelatoriosTabs } from "../RelatoriosTabs";
import { ExportCsvButton } from "@/components/reports/ExportCsvButton";
import { ExportPdfButton } from "@/components/reports/ExportPdfButton";
import { getValorEstoqueCsv } from "@/actions/reports";
import { getValorEstoquePdf } from "@/actions/reports-pdf";

export default async function RelatorioValorEstoquePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stock")
    .select("product_id, quantity, cost_price, products(category_id, categories(name), brand_id, brands(name))");
  const all = (data ?? []) as {
    product_id: number;
    quantity: number;
    cost_price: number;
    products?: { categories?: { name: string } | null; brands?: { name: string } | null } | null;
  }[];
  // Agregar por produto (mesmo produto em vários locais: total = soma)
  const byProduct = new Map<number, { quantity: number; value: number; products: (typeof all)[0]["products"] }>();
  for (const s of all) {
    const cur = byProduct.get(s.product_id);
    const valor = s.quantity * Number(s.cost_price);
    if (!cur) {
      byProduct.set(s.product_id, { quantity: s.quantity, value: valor, products: s.products });
    } else {
      cur.quantity += s.quantity;
      cur.value += valor;
    }
  }
  const byCategory: Record<string, { produtos: number; quantidade: number; valor: number }> = {};
  const byBrand: Record<string, { produtos: number; quantidade: number; valor: number }> = {};
  let totalProdutos = 0, totalQty = 0, totalValor = 0;
  for (const [, p] of byProduct) {
    const cat = p.products?.categories?.name ?? "Sem categoria";
    const brand = p.products?.brands?.name ?? "Sem marca";
    if (!byCategory[cat]) byCategory[cat] = { produtos: 0, quantidade: 0, valor: 0 };
    byCategory[cat].produtos += 1;
    byCategory[cat].quantidade += p.quantity;
    byCategory[cat].valor += p.value;
    if (!byBrand[brand]) byBrand[brand] = { produtos: 0, quantidade: 0, valor: 0 };
    byBrand[brand].produtos += 1;
    byBrand[brand].quantidade += p.quantity;
    byBrand[brand].valor += p.value;
    totalProdutos += 1;
    totalQty += p.quantity;
    totalValor += p.value;
  }
  const categoryRows = Object.entries(byCategory).sort((a, b) => b[1].valor - a[1].valor);
  const brandRows = Object.entries(byBrand).sort((a, b) => b[1].valor - a[1].valor);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-bmq-dark mb-2">Relatórios</h1>
      <p className="text-bmq-mid-dark mb-4">Visão financeira e operacional por período.</p>
      <RelatoriosTabs currentTab="valor-estoque" />
      <div className="flex justify-end gap-2 mb-6">
        <ExportCsvButton onExport={getValorEstoqueCsv} label="Exportar CSV" />
        <ExportPdfButton onExport={getValorEstoquePdf} label="Exportar PDF" />
      </div>
      <h2 className="text-lg font-semibold text-bmq-dark mb-2">Valor de Estoque</h2>
      <p className="text-bmq-mid-dark mb-6">Por categoria e por marca. Valor total geral.</p>

      <div className="rounded-xl border border-bmq-border bg-white p-6 mb-6">
        <h3 className="text-lg font-semibold text-bmq-dark mb-4">Total geral</h3>
        <dl className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-bmq-mid-dark">Produtos</dt>
            <dd className="text-xl font-semibold text-bmq-dark">{totalProdutos}</dd>
          </div>
          <div>
            <dt className="text-bmq-mid-dark">Quantidade total</dt>
            <dd className="text-xl font-semibold text-bmq-dark">{totalQty}</dd>
          </div>
          <div>
            <dt className="text-bmq-mid-dark">Valor total (R$)</dt>
            <dd className="text-xl font-semibold text-bmq-dark">{totalValor.toFixed(2)}</dd>
          </div>
        </dl>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-bmq-border bg-white p-6">
          <h3 className="text-lg font-semibold text-bmq-dark mb-4">Por categoria</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-bmq-border text-left text-bmq-mid-dark">
                  <th className="py-2">Categoria</th>
                  <th className="py-2 text-right">Produtos</th>
                  <th className="py-2 text-right">Qtd</th>
                  <th className="py-2 text-right">Valor (R$)</th>
                </tr>
              </thead>
              <tbody>
                {categoryRows.map(([name, v]) => (
                  <tr key={name} className="border-b border-bmq-border">
                    <td className="py-2 font-medium text-bmq-dark">{name}</td>
                    <td className="py-2 text-right text-bmq-mid-dark">{v.produtos}</td>
                    <td className="py-2 text-right text-bmq-mid-dark">{v.quantidade}</td>
                    <td className="py-2 text-right font-medium text-bmq-dark">{v.valor.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-xl border border-bmq-border bg-white p-6">
          <h3 className="text-lg font-semibold text-bmq-dark mb-4">Por marca</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-bmq-border text-left text-bmq-mid-dark">
                  <th className="py-2">Marca</th>
                  <th className="py-2 text-right">Produtos</th>
                  <th className="py-2 text-right">Qtd</th>
                  <th className="py-2 text-right">Valor (R$)</th>
                </tr>
              </thead>
              <tbody>
                {brandRows.map(([name, v]) => (
                  <tr key={name} className="border-b border-bmq-border">
                    <td className="py-2 font-medium text-bmq-dark">{name}</td>
                    <td className="py-2 text-right text-bmq-mid-dark">{v.produtos}</td>
                    <td className="py-2 text-right text-bmq-mid-dark">{v.quantidade}</td>
                    <td className="py-2 text-right font-medium text-bmq-dark">{v.valor.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
