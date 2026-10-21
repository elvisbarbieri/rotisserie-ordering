"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatMoney, storeApi } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { deliveryFeeCents } from "@/lib/delivery";

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, totalCents, clear } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">(
    "PICKUP"
  );
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fee = useMemo(() => deliveryFeeCents(fulfillment), [fulfillment]);
  const grandTotal = totalCents + fee;

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-3xl">Nada para finalizar</h1>
        <Link href="/cardapio" className="mt-6 inline-block text-[var(--flame)] underline">
          Voltar ao cardápio
        </Link>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const order = await storeApi.placeOrder({
        customerName: name,
        customerPhone: phone,
        fulfillment,
        customerNotes: notes || undefined,
        deliveryStreet: fulfillment === "DELIVERY" ? street : undefined,
        deliveryNumber: fulfillment === "DELIVERY" ? number : undefined,
        lines: lines.map((l) => ({
          itemId: l.itemId,
          qty: l.qty,
          notes: l.notes || null,
        })),
      });
      clear();
      router.push(`/pedido/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="font-display text-4xl text-[var(--ink)]">Finalizar</h1>
      <p className="mt-2 text-[var(--muted)]">
        Subtotal {formatMoney(totalCents)}
        {fee > 0 ? ` · Taxa de entrega ${formatMoney(fee)}` : ""}. Pagamento na
        entrega ou retirada.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <label className="block text-sm font-medium">
          Seu nome
          <input
            required
            className="mt-1.5 w-full rounded-md border border-[var(--line)] bg-white px-3 py-3"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </label>
        <label className="block text-sm font-medium">
          WhatsApp / telefone
          <input
            required
            type="tel"
            className="mt-1.5 w-full rounded-md border border-[var(--line)] bg-white px-3 py-3"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder="(11) 99999-9999"
          />
        </label>

        <fieldset>
          <legend className="text-sm font-medium">Como prefere?</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                ["PICKUP", "Retirar na loja"],
                ["DELIVERY", "Entrega"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFulfillment(value)}
                className={`rounded-md px-3 py-3 text-sm font-medium ring-1 transition ${
                  fulfillment === value
                    ? "bg-[var(--ink)] text-white ring-[var(--ink)]"
                    : "bg-white text-[var(--ink-soft)] ring-[var(--line)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        {fulfillment === "DELIVERY" && (
          <div className="space-y-4 rounded-md bg-white p-4 ring-1 ring-[var(--line)]">
            <p className="text-sm font-medium text-[var(--ink)]">
              Endereço de entrega
            </p>
            <label className="block text-sm font-medium">
              Rua
              <input
                required
                className="mt-1.5 w-full rounded-md border border-[var(--line)] bg-white px-3 py-3"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                autoComplete="street-address"
                placeholder="Rua das Flores"
              />
            </label>
            <label className="block text-sm font-medium">
              Número
              <input
                required
                className="mt-1.5 w-full rounded-md border border-[var(--line)] bg-white px-3 py-3"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                autoComplete="address-line2"
                placeholder="123"
              />
            </label>
            <p className="text-sm text-[var(--muted)]">
              Taxa de entrega:{" "}
              <span className="font-semibold text-[var(--ink)]">
                {formatMoney(fee)}
              </span>
            </p>
          </div>
        )}

        <label className="block text-sm font-medium">
          Observações
          <textarea
            className="mt-1.5 w-full rounded-md border border-[var(--line)] bg-white px-3 py-3"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Horário, preferências…"
          />
        </label>

        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatMoney(grandTotal)}</span>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-[var(--flame)] py-3.5 font-semibold text-white hover:bg-[var(--flame-deep)] disabled:opacity-60"
        >
          {busy ? "Enviando…" : "Confirmar pedido"}
        </button>
      </form>
    </div>
  );
}
