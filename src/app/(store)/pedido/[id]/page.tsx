"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Order, formatMoney, storeApi } from "@/lib/api";

export default function PedidoConfirmadoPage() {
  const params = useParams();
  const id = String(params.id || "");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    storeApi
      .getOrder(id)
      .then(setOrder)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Pedido não encontrado")
      );
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-red-800">{error}</p>
        <Link href="/cardapio" className="mt-6 inline-block text-[var(--flame)]">
          Cardápio
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-[var(--muted)]">
        Carregando pedido…
      </div>
    );
  }

  const isDelivery = order.fulfillment === "DELIVERY";
  const fee = order.deliveryFeeCents ?? 0;
  const itemsTotal = order.totalCents - fee;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <p className="animate-fade text-sm font-semibold uppercase tracking-wide text-[var(--ok)]">
        Pedido enviado
      </p>
      <h1 className="font-display animate-rise mt-2 text-4xl text-[var(--ink)]">
        Já está na cozinha
      </h1>
      <p className="animate-rise mt-3 text-[var(--muted)]" style={{ animationDelay: "0.1s" }}>
        {isDelivery
          ? "Pague na entrega — online em breve."
          : "Pague na retirada — online em breve."}
      </p>

      <div className="mt-8 rounded-md bg-white p-5 ring-1 ring-[var(--line)]">
        <p className="text-sm text-[var(--muted)]">Cliente</p>
        <p className="font-medium">
          {order.customerName}
          {order.customerPhone ? ` · ${order.customerPhone}` : ""}
        </p>
        <p className="mt-4 text-sm text-[var(--muted)]">Modalidade</p>
        <p className="font-medium">
          {isDelivery ? "Entrega" : "Retirada na loja"}
        </p>
        {isDelivery && (order.deliveryStreet || order.deliveryNumber) && (
          <>
            <p className="mt-4 text-sm text-[var(--muted)]">Endereço</p>
            <p className="font-medium">
              {order.deliveryStreet}
              {order.deliveryNumber ? `, ${order.deliveryNumber}` : ""}
            </p>
          </>
        )}
        <ul className="mt-4 space-y-1 border-t border-[var(--line)] pt-4 text-sm">
          {order.lines.map((line, i) => (
            <li key={i}>
              {line.qty}× {line.name}
              {line.notes ? ` — ${line.notes}` : ""}
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-[var(--line)] pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Itens</span>
            <span>{formatMoney(itemsTotal)}</span>
          </div>
          {isDelivery && (
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Taxa de entrega</span>
              <span>{formatMoney(fee)}</span>
            </div>
          )}
          <p className="flex justify-between pt-1 text-lg font-semibold">
            <span>Total</span>
            <span>{formatMoney(order.totalCents)}</span>
          </p>
        </div>
      </div>

      <Link
        href="/cardapio"
        className="mt-8 inline-flex rounded-md bg-[var(--ink)] px-5 py-3 font-semibold text-white"
      >
        Fazer outro pedido
      </Link>
    </div>
  );
}
