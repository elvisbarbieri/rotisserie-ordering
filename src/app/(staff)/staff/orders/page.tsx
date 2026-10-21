"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Order, client, formatMoney } from "@/lib/api";

const NEXT: Record<string, "IN_PROGRESS" | "READY" | "COMPLETED" | undefined> = {
  SENT: "IN_PROGRESS",
  IN_PROGRESS: "READY",
  READY: "COMPLETED",
};

const STATUS_META: Record<
  string,
  { label: string; className: string; icon: ReactNode }
> = {
  DRAFT: {
    label: "Rascunho",
    className: "bg-stone-100 text-stone-700",
    icon: (
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    ),
  },
  SENT: {
    label: "Enviado",
    className: "bg-sky-100 text-sky-800",
    icon: (
      <>
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </>
    ),
  },
  IN_PROGRESS: {
    label: "Preparando",
    className: "bg-amber-100 text-amber-900",
    icon: (
      <>
        <path d="M12 2v4" />
        <path d="M12 18v4" />
        <path d="M4.93 4.93l2.83 2.83" />
        <path d="M16.24 16.24l2.83 2.83" />
        <path d="M2 12h4" />
        <path d="M18 12h4" />
        <path d="M4.93 19.07l2.83-2.83" />
        <path d="M16.24 7.76l2.83-2.83" />
      </>
    ),
  },
  READY: {
    label: "Pronto",
    className: "bg-emerald-100 text-emerald-800",
    icon: (
      <>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </>
    ),
  },
  COMPLETED: {
    label: "Concluído",
    className: "bg-stone-200 text-stone-700",
    icon: <polyline points="20 6 9 17 4 12" />,
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-red-100 text-red-800",
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </>
    ),
  },
};

const ADVANCE_LABEL: Record<string, string> = {
  IN_PROGRESS: "Marcar como preparando",
  READY: "Marcar como pronto",
  COMPLETED: "Marcar como concluído",
};

function Icon({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? {
    label: status,
    className: "bg-stone-100 text-stone-700",
    icon: <circle cx="12" cy="12" r="10" />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${meta.className}`}
      title={meta.label}
    >
      <Icon>{meta.icon}</Icon>
      <span className="sr-only sm:not-sr-only">{meta.label}</span>
    </span>
  );
}

function FulfillmentBadge({ fulfillment }: { fulfillment?: string }) {
  const isDelivery = fulfillment === "DELIVERY";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${
        isDelivery
          ? "bg-[var(--flame)]/15 text-[var(--flame-deep)]"
          : "bg-[var(--ink)]/10 text-[var(--ink)]"
      }`}
      title={isDelivery ? "Para entrega" : "Retirada"}
    >
      <Icon>
        {isDelivery ? (
          <>
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <path d="M16 8h4l3 3v5h-7V8z" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </>
        ) : (
          <>
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </>
        )}
      </Icon>
      {isDelivery ? "Para entrega" : "Retirada"}
    </span>
  );
}

function IconButton({
  label,
  onClick,
  tone = "neutral",
  children,
}: {
  label: string;
  onClick: () => void;
  tone?: "neutral" | "primary" | "danger";
  children: ReactNode;
}) {
  const toneClass =
    tone === "primary"
      ? "bg-[var(--flame)] text-white hover:bg-[var(--flame-deep)]"
      : tone === "danger"
        ? "border border-red-200 text-red-800 hover:bg-red-50"
        : "border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--bone)]";

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md transition ${toneClass}`}
    >
      <Icon>{children}</Icon>
    </button>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("DRAFT,SENT,IN_PROGRESS,READY");
  const [error, setError] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setOrders(await client.listOrders(filter));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao listar pedidos");
    }
  }, [filter]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, [load]);

  async function send(id: string) {
    await client.sendOrder(id);
    await load();
  }

  async function advance(order: Order) {
    const next = NEXT[order.status];
    if (!next) return;
    await client.updateStatus(order.id, next);
    await load();
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelBusy(true);
    try {
      await client.cancelOrder(cancelTarget.id);
      setCancelTarget(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao cancelar pedido");
    } finally {
      setCancelBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Pedidos</h1>
          <p className="text-[var(--muted)]">
            Acompanhe status e envie rascunhos à cozinha.
          </p>
        </div>
        <label className="text-sm">
          Filtro
          <select
            className="ml-2 rounded-md border border-[var(--line)] bg-white px-3 py-2"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="DRAFT,SENT,IN_PROGRESS,READY">Abertos</option>
            <option value="SENT,IN_PROGRESS,READY">Cozinha</option>
            <option value="COMPLETED">Concluídos</option>
            <option value="CANCELLED">Cancelados</option>
            <option value="DRAFT">Rascunhos</option>
          </select>
        </label>
      </div>

      {error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {orders.map((order) => {
          const next = NEXT[order.status];
          return (
            <article
              key={order.id}
              className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">
                      {order.customerName || "Sem nome"}
                    </h2>
                    <StatusBadge status={order.status} />
                    <FulfillmentBadge fulfillment={order.fulfillment} />
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    <span className="font-mono text-xs">{order.id}</span>
                    {" · "}
                    print {order.printStatus}
                    {" · "}
                    {formatMoney(order.totalCents)}
                    {" · "}
                    {order.paymentMethod}
                  </p>
                  <ul className="mt-2 text-sm">
                    {order.lines.map((line, idx) => (
                      <li key={`${order.id}-${idx}`}>
                        {line.qty}× {line.name}
                        {line.notes ? ` (${line.notes})` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-2">
                  {order.status === "DRAFT" && (
                    <IconButton
                      label="Enviar à cozinha"
                      tone="primary"
                      onClick={() => void send(order.id)}
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </IconButton>
                  )}
                  {next && (
                    <IconButton
                      label={ADVANCE_LABEL[next] ?? `Avançar para ${next}`}
                      onClick={() => void advance(order)}
                    >
                      {next === "IN_PROGRESS" ? (
                        <>
                          <path d="M12 2v4" />
                          <path d="M12 18v4" />
                          <path d="M4.93 4.93l2.83 2.83" />
                          <path d="M16.24 16.24l2.83 2.83" />
                          <path d="M2 12h4" />
                          <path d="M18 12h4" />
                          <path d="M4.93 19.07l2.83-2.83" />
                          <path d="M16.24 7.76l2.83-2.83" />
                        </>
                      ) : next === "READY" ? (
                        <>
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </>
                      ) : (
                        <polyline points="20 6 9 17 4 12" />
                      )}
                    </IconButton>
                  )}
                  {order.status !== "COMPLETED" &&
                    order.status !== "CANCELLED" && (
                      <IconButton
                        label="Cancelar pedido"
                        tone="danger"
                        onClick={() => setCancelTarget(order)}
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </IconButton>
                    )}
                </div>
              </div>
            </article>
          );
        })}
        {orders.length === 0 && (
          <p className="text-[var(--muted)]">Nenhum pedido neste filtro.</p>
        )}
      </div>

      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-order-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg ring-1 ring-[var(--line)]">
            <h2
              id="cancel-order-title"
              className="font-display text-2xl text-[var(--ink)]"
            >
              Cancelar pedido?
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Essa ação não pode ser desfeita. Confirma o cancelamento de{" "}
              <span className="font-semibold text-[var(--ink)]">
                {cancelTarget.customerName || "Sem nome"}
              </span>
              ?
            </p>
            <p className="mt-1 font-mono text-xs text-[var(--muted)]">
              {cancelTarget.id}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={cancelBusy}
                onClick={() => setCancelTarget(null)}
                className="rounded-md border border-[var(--line)] px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={cancelBusy}
                onClick={() => void confirmCancel()}
                className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
              >
                {cancelBusy ? "Cancelando…" : "Sim, cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
