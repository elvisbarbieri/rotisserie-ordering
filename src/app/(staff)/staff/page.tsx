"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartLine,
  Item,
  client,
  formatMoney,
} from "@/lib/api";

export default function PosPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await client.listItems(true));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar cardápio");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalCents = useMemo(
    () => cart.reduce((sum, line) => sum + line.unitPriceCents * line.qty, 0),
    [cart]
  );

  function addItem(item: Item) {
    setCart((prev) => {
      const existing = prev.find((l) => l.itemId === item.id);
      if (existing) {
        return prev.map((l) =>
          l.itemId === item.id ? { ...l, qty: l.qty + 1 } : l
        );
      }
      return [
        ...prev,
        {
          itemId: item.id,
          name: item.name,
          qty: 1,
          unitPriceCents: item.priceCents,
          notes: "",
        },
      ];
    });
  }

  function updateQty(itemId: string, qty: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.itemId === itemId ? { ...l, qty } : l))
        .filter((l) => l.qty > 0)
    );
  }

  function updateNotes(itemId: string, notes: string) {
    setCart((prev) =>
      prev.map((l) => (l.itemId === itemId ? { ...l, notes } : l))
    );
  }

  async function submit(sendNow: boolean) {
    if (cart.length === 0) return;
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const order = await client.createOrder({
        customerName: customerName || undefined,
        paymentMethod,
        sendNow,
        lines: cart.map((l) => ({
          itemId: l.itemId,
          qty: l.qty,
          notes: l.notes || null,
        })),
      });
      setCart([]);
      setCustomerName("");
      setMessage(
        sendNow
          ? `Pedido ${order.id} enviado à cozinha`
          : `Rascunho ${order.id} salvo`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar pedido");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section>
        <h1 className="mb-1 text-3xl text-[var(--ink)]">Novo pedido</h1>
        <p className="mb-4 text-[var(--muted)]">
          Monte o pedido no balcão e envie para impressão na cozinha.
        </p>
        {error && (
          <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        {message && (
          <p className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {message}
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => addItem(item)}
              className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 text-left transition hover:border-[var(--flame)]"
            >
              <div className="font-semibold text-[var(--ink)]">{item.name}</div>
              <div className="text-sm text-[var(--muted)]">{item.category}</div>
              <div className="mt-2 text-[var(--flame)]">
                {formatMoney(item.priceCents)}
              </div>
            </button>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-[var(--muted)]">
              Nenhum item disponível. Cadastre no Cardápio.
            </p>
          )}
        </div>
      </section>

      <aside className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
        <h2 className="mb-3 text-xl">Carrinho</h2>
        <label className="mb-3 block text-sm">
          Cliente / mesa
          <input
            className="mt-1 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Mesa 3"
          />
        </label>
        <label className="mb-4 block text-sm">
          Pagamento
          <select
            className="mt-1 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="CASH">Dinheiro</option>
            <option value="CARD">Cartão</option>
            <option value="OTHER">Outro</option>
          </select>
        </label>

        <ul className="mb-4 space-y-3">
          {cart.map((line) => (
            <li key={line.itemId} className="border-b border-[var(--line)] pb-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{line.name}</span>
                <span>{formatMoney(line.unitPriceCents * line.qty)}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  className="rounded border px-2"
                  onClick={() => updateQty(line.itemId, line.qty - 1)}
                >
                  −
                </button>
                <span className="w-6 text-center">{line.qty}</span>
                <button
                  type="button"
                  className="rounded border px-2"
                  onClick={() => updateQty(line.itemId, line.qty + 1)}
                >
                  +
                </button>
              </div>
              <input
                className="mt-2 w-full rounded border border-[var(--line)] px-2 py-1 text-sm"
                placeholder="Observação"
                value={line.notes}
                onChange={(e) => updateNotes(line.itemId, e.target.value)}
              />
            </li>
          ))}
        </ul>

        <div className="mb-4 flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatMoney(totalCents)}</span>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={busy || cart.length === 0}
            onClick={() => void submit(true)}
            className="rounded-md bg-[var(--flame)] px-4 py-2.5 font-medium text-white hover:bg-[var(--flame-deep)] disabled:opacity-50"
          >
            Enviar à cozinha
          </button>
          <button
            type="button"
            disabled={busy || cart.length === 0}
            onClick={() => void submit(false)}
            className="rounded-md border border-[var(--line)] px-4 py-2 font-medium disabled:opacity-50"
          >
            Salvar rascunho
          </button>
        </div>
      </aside>
    </div>
  );
}
