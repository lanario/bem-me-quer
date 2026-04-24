import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FiArrowLeft, FiShoppingBag } from "react-icons/fi";
import type { Tables } from "@/types/database";

type SellItemNested = {
  id: number;
  product_id: number;
  quantity: number;
  unitary_price: number | null;
  subtotal: number;
  products?: { title: string } | null;
};

type SellWithItems = Pick<
  Tables<"sells">,
  "id" | "data" | "total_value" | "discount_value" | "status"
> & {
  sell_items?: SellItemNested[] | null;
};

function formatDateTime(value: string): string {
  try {
    return new Date(value).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

export default async function ClienteComprasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const clientId = Number(idParam);
  if (!Number.isFinite(clientId) || clientId < 1) {
    notFound();
  }

  const supabase = await createClient();

  const { data: clientRow, error: clientError } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", clientId)
    .single();

  if (clientError || !clientRow) {
    notFound();
  }

  const client = clientRow as { id: number; name: string };

  const { data: sellsData, error: sellsError } = await supabase
    .from("sells")
    .select(
      "id, data, total_value, discount_value, status, sell_items(id, product_id, quantity, unitary_price, subtotal, products(title))",
    )
    .eq("client_id", clientId)
    .eq("status", "CONCLUIDA")
    .order("data", { ascending: false });

  if (sellsError) {
    return (
      <div className="p-dashboard">
        <p className="text-red-600">Erro ao carregar compras: {sellsError.message}</p>
        <Link
          href="/dashboard/clientes"
          className="mt-4 inline-flex items-center gap-2 text-sm text-bmq-mid-dark hover:underline"
        >
          <FiArrowLeft size={16} />
          Voltar para clientes
        </Link>
      </div>
    );
  }

  const sells = (sellsData ?? []) as SellWithItems[];

  const productTotals = new Map<string, number>();
  for (const sell of sells) {
    for (const item of sell.sell_items ?? []) {
      const title = item.products?.title ?? `Produto #${item.product_id}`;
      productTotals.set(title, (productTotals.get(title) ?? 0) + Number(item.quantity));
    }
  }
  const sortedProducts = Array.from(productTotals.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-dashboard">
      <Link
        href="/dashboard/clientes"
        className="mb-6 inline-flex items-center gap-2 text-sm text-bmq-mid-dark hover:text-bmq-dark"
      >
        <FiArrowLeft size={18} />
        Voltar para clientes
      </Link>

      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-bmq-dark sm:text-2xl">Compras concluídas</h1>
          <p className="mt-1 text-sm text-bmq-mid-dark">
            Histórico de vendas finalizadas de{" "}
            <span className="font-medium text-bmq-dark">{client.name}</span> — útil para promoções e
            acompanhamento de produtos.
          </p>
        </div>
      </div>

      {sells.length === 0 ? (
        <div className="rounded-card border border-bmq-border bg-white py-12 text-center text-bmq-mid-dark shadow-card">
          <FiShoppingBag className="mx-auto mb-3 text-bmq-mid" size={40} />
          <p>Nenhuma compra concluída registrada para este cliente.</p>
          <p className="mt-2 text-xs">
            Apenas vendas com status <strong>Concluída</strong> aparecem aqui.
          </p>
        </div>
      ) : (
        <>
          {sortedProducts.length > 0 && (
            <section
              className="mb-8 rounded-card border border-bmq-border bg-white p-4 shadow-card sm:p-6"
              style={{ backgroundColor: "var(--bmq-cardBg, #FFFFFF)" }}
            >
              <h2 className="mb-3 text-base font-semibold text-bmq-dark sm:text-lg">
                Resumo por produto
              </h2>
              <p className="mb-4 text-xs text-bmq-mid-dark sm:text-sm">
                Quantidade total já comprada neste cliente (todas as vendas concluídas).
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-bmq-border text-left text-bmq-dark">
                      <th className="py-2 pr-4 font-medium">Produto</th>
                      <th className="py-2 text-right font-medium">Qtd total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProducts.map(([title, qty]) => (
                      <tr key={title} className="border-b border-bmq-border">
                        <td className="py-2 pr-4 text-bmq-mid-dark">{title}</td>
                        <td className="py-2 text-right font-medium text-bmq-dark">{qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section className="space-y-4">
            <h2 className="text-base font-semibold text-bmq-dark sm:text-lg">Vendas</h2>
            {sells.map((sell) => {
              const discount = Number(sell.discount_value ?? 0);
              return (
                <article
                  key={sell.id}
                  className="rounded-card border border-bmq-border bg-white shadow-card"
                  style={{ backgroundColor: "var(--bmq-cardBg, #FFFFFF)" }}
                >
                  <div className="flex flex-col gap-2 border-b border-bmq-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-bmq-dark">
                        Venda #{sell.id}
                      </p>
                      <p className="text-xs text-bmq-mid-dark">{formatDateTime(sell.data)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-semibold text-bmq-dark">
                        Total: R${" "}
                        {Number(sell.total_value).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      {discount > 0 && (
                        <span className="text-xs text-bmq-mid-dark">
                          Desconto: R${" "}
                          {discount.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      )}
                      <Link
                        href={`/dashboard/vendas/${sell.id}`}
                        className="text-xs font-medium text-bmq-accent hover:underline"
                      >
                        Ver detalhes
                      </Link>
                    </div>
                  </div>
                  <div className="overflow-x-auto p-4 pt-0 sm:p-6 sm:pt-0">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-bmq-border text-left text-bmq-dark">
                          <th className="py-2 pr-4 font-medium">Produto</th>
                          <th className="py-2 pr-4 text-right font-medium">Qtd</th>
                          <th className="py-2 pr-4 text-right font-medium">Preço unit.</th>
                          <th className="py-2 text-right font-medium">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(sell.sell_items ?? []).map((item) => (
                          <tr key={item.id} className="border-b border-bmq-border">
                            <td className="py-2 pr-4 text-bmq-mid-dark">
                              {item.products?.title ?? "—"}
                            </td>
                            <td className="py-2 pr-4 text-right text-bmq-dark">{item.quantity}</td>
                            <td className="py-2 pr-4 text-right text-bmq-mid-dark">
                              R${" "}
                              {Number(item.unitary_price ?? 0).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="py-2 text-right font-medium text-bmq-dark">
                              R${" "}
                              {Number(item.subtotal).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}
