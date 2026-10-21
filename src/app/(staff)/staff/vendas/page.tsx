"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SalesPeriod,
  SalesReport,
  client,
  formatMoney,
} from "@/lib/api";
import { downloadSalesExcel } from "@/lib/salesExport";

const PERIODS: { id: SalesPeriod; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "yesterday", label: "Ontem" },
  { id: "week", label: "7 dias" },
  { id: "month", label: "30 dias" },
];

const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Dinheiro",
  CARD: "Cartão",
  OTHER: "Outro",
};

const FULFILLMENT_LABEL: Record<string, string> = {
  PICKUP: "Retirada",
  DELIVERY: "Entrega",
};

const STATUS_LABEL: Record<string, string> = {
  SENT: "Enviado",
  IN_PROGRESS: "Preparando",
  READY: "Pronto",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

function formatPct(rate: number): string {
  return rate.toLocaleString("pt-BR", {
    style: "percent",
    maximumFractionDigits: 1,
  });
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function BarList({
  rows,
  labelOf,
}: {
  rows: { key: string; orderCount: number; totalCents: number }[];
  labelOf: (key: string) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.totalCents));
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="font-medium text-[var(--ink)]">
              {labelOf(row.key)}
            </span>
            <span className="text-[var(--muted)]">
              {row.orderCount} · {formatMoney(row.totalCents)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--ash)]">
            <div
              className="h-full rounded-full bg-[var(--flame)]"
              style={{ width: `${(row.totalCents / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
      {rows.every((r) => r.orderCount === 0) && (
        <li className="text-sm text-[var(--muted)]">Sem dados no período.</li>
      )}
    </ul>
  );
}

function SeriesChart({
  series,
}: {
  series: SalesReport["series"];
}) {
  const max = Math.max(1, ...series.map((s) => s.totalCents));
  if (series.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Nenhuma venda registrada neste período.
      </p>
    );
  }
  return (
    <div className="flex h-44 items-end gap-1.5 sm:gap-2">
      {series.map((point) => (
        <div
          key={point.bucket}
          className="flex min-w-0 flex-1 flex-col items-center gap-1"
          title={`${point.label}: ${formatMoney(point.totalCents)} (${point.orderCount} pedidos)`}
        >
          <div className="flex h-36 w-full items-end justify-center">
            <div
              className="w-full max-w-8 rounded-t-md bg-[var(--flame)] transition"
              style={{
                height: `${Math.max(4, (point.totalCents / max) * 100)}%`,
              }}
            />
          </div>
          <span className="truncate text-[10px] text-[var(--muted)] sm:text-xs">
            {point.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function VendasPage() {
  const [period, setPeriod] = useState<SalesPeriod>("today");
  const [report, setReport] = useState<SalesReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setReport(await client.salesReport(period));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar vendas");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    setLoading(true);
    void load();
    const id = setInterval(() => void load(), 30000);
    return () => clearInterval(id);
  }, [load]);

  const kpis = report?.kpis;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mb-1 text-3xl text-[var(--ink)]">Vendas</h1>
          <p className="text-[var(--muted)]">
            Painel de faturamento do período (horário de Brasília).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-1">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  period === p.id
                    ? "bg-[var(--flame)] text-white"
                    : "text-[var(--ink)] hover:bg-[var(--ash)]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!report}
            onClick={() => report && downloadSalesExcel(report, period)}
            title="Baixar planilha Excel"
            aria-label="Baixar planilha Excel"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--panel)] text-[#217346] transition hover:bg-[#217346]/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
                fill="#217346"
              />
              <path d="M14 2v6h6" fill="#185C37" />
              <path
                d="M8.2 17.2 10.1 14l-1.8-3.2h1.5l1.1 2.1 1.1-2.1h1.5L11.7 14l1.9 3.2h-1.5l-1.2-2.2-1.2 2.2H8.2z"
                fill="white"
              />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {loading && !report ? (
        <p className="text-sm text-[var(--muted)]">Carregando relatório…</p>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
              <p className="text-sm text-[var(--muted)]">Faturamento</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--ink)]">
                {formatMoney(kpis?.grossSalesCents ?? 0)}
              </p>
            </article>
            <article className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
              <p className="text-sm text-[var(--muted)]">Pedidos</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--ink)]">
                {(kpis?.orderCount ?? 0).toLocaleString("pt-BR")}
              </p>
            </article>
            <article className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
              <p className="text-sm text-[var(--muted)]">Ticket médio</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--ink)]">
                {formatMoney(kpis?.averageTicketCents ?? 0)}
              </p>
            </article>
            <article className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
              <p className="text-sm text-[var(--muted)]">Cancelamentos</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--ink)]">
                {(kpis?.cancelledCount ?? 0).toLocaleString("pt-BR")}
                <span className="ml-2 text-base font-normal text-[var(--muted)]">
                  ({formatPct(kpis?.cancelRate ?? 0)})
                </span>
              </p>
              {(kpis?.deliveryFeeCents ?? 0) > 0 && (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Taxas de entrega: {formatMoney(kpis?.deliveryFeeCents ?? 0)}
                </p>
              )}
            </article>
          </section>

          <section className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
            <h2 className="mb-1 text-xl text-[var(--ink)]">
              Evolução do faturamento
            </h2>
            <p className="mb-4 text-sm text-[var(--muted)]">
              {report?.seriesMode === "hour"
                ? "Agrupado por hora"
                : "Agrupado por dia"}
            </p>
            <SeriesChart series={report?.series ?? []} />
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
              <h2 className="mb-3 text-xl text-[var(--ink)]">Por pagamento</h2>
              <BarList
                rows={report?.byPayment ?? []}
                labelOf={(k) => PAYMENT_LABEL[k] || k}
              />
            </section>
            <section className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
              <h2 className="mb-3 text-xl text-[var(--ink)]">
                Retirada × entrega
              </h2>
              <BarList
                rows={report?.byFulfillment ?? []}
                labelOf={(k) => FULFILLMENT_LABEL[k] || k}
              />
            </section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
              <h2 className="mb-3 text-xl text-[var(--ink)]">
                Itens mais vendidos
              </h2>
              {(report?.topItems?.length ?? 0) === 0 ? (
                <p className="text-sm text-[var(--muted)]">Sem itens no período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[280px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--line)] text-[var(--muted)]">
                        <th className="pb-2 font-medium">Item</th>
                        <th className="pb-2 font-medium">Qtd</th>
                        <th className="pb-2 font-medium">Receita</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report?.topItems.map((item) => (
                        <tr
                          key={item.itemId || item.name}
                          className="border-b border-[var(--line)] last:border-0"
                        >
                          <td className="py-2 font-medium text-[var(--ink)]">
                            {item.name}
                          </td>
                          <td className="py-2 text-[var(--muted)]">
                            {item.qty.toLocaleString("pt-BR")}
                          </td>
                          <td className="py-2 text-[var(--flame)]">
                            {formatMoney(item.revenueCents)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
              <h2 className="mb-3 text-xl text-[var(--ink)]">Status no período</h2>
              <BarList
                rows={report?.byStatus ?? []}
                labelOf={(k) => STATUS_LABEL[k] || k}
              />
            </section>
          </div>

          <section className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
            <h2 className="mb-3 text-xl text-[var(--ink)]">Pedidos recentes</h2>
            {(report?.recentOrders?.length ?? 0) === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Nenhum pedido vendido neste período.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--line)]">
                {report?.recentOrders.map((order) => (
                  <li
                    key={order.id}
                    className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--ink)]">
                        {order.customerName || "Cliente"} ·{" "}
                        {STATUS_LABEL[order.status] || order.status}
                      </p>
                      <p className="truncate text-sm text-[var(--muted)]">
                        {order.linesSummary || "—"}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {formatWhen(order.sentAt || order.createdAt)} ·{" "}
                        {PAYMENT_LABEL[order.paymentMethod] ||
                          order.paymentMethod}{" "}
                        ·{" "}
                        {FULFILLMENT_LABEL[order.fulfillment || ""] ||
                          order.fulfillment ||
                          "Retirada"}
                      </p>
                    </div>
                    <p className="shrink-0 text-lg font-semibold text-[var(--flame)]">
                      {formatMoney(order.totalCents)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
