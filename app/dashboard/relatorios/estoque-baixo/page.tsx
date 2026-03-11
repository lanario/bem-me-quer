import { createClient } from "@/lib/supabase/server";
import { RelatoriosTabs } from "../RelatoriosTabs";
import { ExportCsvButton } from "@/components/reports/ExportCsvButton";
import { ExportPdfButton } from "@/components/reports/ExportPdfButton";
import { getEstoqueBaixoCsv } from "@/actions/reports";
import { getEstoqueBaixoPdf } from "@/actions/reports-pdf";

export default async function RelatorioEstoqueBaixoPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stock")
    .select("product_id, quantity, min_quantity, cost_price, products(title, brands(name), categories(name))")
    .order("product_id");
  const all = (data ?? []) as {
    product_id: number;
    quantity: number;
    min_quantity: number;
    cost_price: number;
    products?: { title: string; brands?: { name: string }; categories?: { name: string } } | null;
  }[];
  const byProduct = new Map<
    number,
    { quantity: number; min_quantity: number; cost_price: number; products: (typeof all)[0]["products"] }
  >();
  for (const s of all) {
    const cur = byProduct.get(s.product_id);
    if (!cur) {
      byProduct.set(s.product_id, {
        quantity: s.quantity,
        min_quantity: s.min_quantity,
        cost_price: s.cost_price,
        products: s.products,
      });
    } else {
      cur.quantity += s.quantity;
      cur.min_quantity = Math.max(cur.min_quantity, s.min_quantity);
    }
  }
  const rows = [...byProduct.values()].filter((p) => p.min_quantity > 0 && p.quantity <= p.min_quantity && p.quantity >= 0);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-bmq-dark mb-2">Relatórios</h1>
      <p className="text-bmq-mid-dark mb-4">Visão financeira e operacional por período.</p>
      <RelatoriosTabs currentTab="estoque-baixo" />
      <div className="flex justify-end gap-2 mb-6">
        <ExportCsvButton onExport={getEstoqueBaixoCsv} label="Exportar CSV" />
        <ExportPdfButton onExport={getEstoqueBaixoPdf} label="Exportar PDF" />
      </div>
      <h2 className="text-lg font-semibold text-bmq-dark mb-2">Estoque Baixo</h2>
      <p className="text-bmq-mid-dark mb-6">Produtos com quantidade ≤ quantidade mínima (excluindo zero). Sugestão de compra = mínimo − quantidade atual.</p>
      <div className="overflow-x-auto rounded-lg border border-bmq-border bg-white">
        <table className="min-w-full divide-y divide-bmq-border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Produto</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Marca</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-bmq-mid-dark">Categoria</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-bmq-mid-dark">Quantidade</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-bmq-mid-dark">Mínimo</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-bmq-mid-dark">Sugestão compra</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-bmq-mid-dark">Preço custo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bmq-border">
            {rows.map((s, i) => {
              const sug = Math.max(0, s.min_quantity - s.quantity);
              return (
                <tr key={i} className="hover:bg-bmq-mid/20">
                  <td className="px-4 py-3 text-sm font-medium text-bmq-dark">{s.products?.title ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-bmq-mid-dark">{s.products?.brands?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-bmq-mid-dark">{s.products?.categories?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-right text-bmq-dark">{s.quantity}</td>
                  <td className="px-4 py-3 text-sm text-right text-bmq-mid-dark">{s.min_quantity}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-amber-700">{sug}</td>
                  <td className="px-4 py-3 text-sm text-right text-bmq-mid-dark">R$ {Number(s.cost_price).toFixed(2)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-bmq-mid-dark">Nenhum produto com estoque baixo.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
