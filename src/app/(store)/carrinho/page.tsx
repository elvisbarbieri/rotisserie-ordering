"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { QtyStepper } from "@/components/store/QtyStepper";
import { ItemImage } from "@/components/store/ItemImage";

function TrashIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export default function CarrinhoPage() {
  const { lines, totalCents, addItem, setQty, remove } = useCart();

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-4xl text-[var(--ink)]">Pedido vazio</h1>
        <p className="mt-3 text-[var(--muted)]">
          Monte seu frango e acompanhamentos no cardápio.
        </p>
        <Link
          href="/cardapio"
          className="mt-8 inline-flex rounded-md bg-[var(--flame)] px-6 py-3 font-semibold text-white"
        >
          Ver cardápio
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 pb-28">
      <h1 className="font-display text-4xl text-[var(--ink)]">Seu pedido</h1>
      <ul className="mt-8 divide-y divide-[var(--line)]">
        {lines.map((line) => (
          <li key={line.itemId} className="flex gap-4 py-5">
            <ItemImage
              src={line.imageUrl}
              alt={line.name}
              className="h-20 w-20 shrink-0 rounded-md"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-xl">{line.name}</h2>
                <button
                  type="button"
                  onClick={() => remove(line.itemId)}
                  aria-label={`Remover ${line.name}`}
                  className="shrink-0 rounded-md p-2 text-[var(--muted)] transition hover:bg-red-50 hover:text-[#dc2626]"
                >
                  <TrashIcon />
                </button>
              </div>
              <p className="mt-1 font-semibold text-[var(--flame)]">
                {formatMoney(line.unitPriceCents * line.qty)}
              </p>
              <div className="mt-3">
                <QtyStepper
                  qty={line.qty}
                  onIncrement={() =>
                    addItem({
                      itemId: line.itemId,
                      name: line.name,
                      unitPriceCents: line.unitPriceCents,
                      imageUrl: line.imageUrl,
                    })
                  }
                  onDecrement={() => setQty(line.itemId, line.qty - 1)}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex justify-between text-lg font-semibold">
        <span>Total</span>
        <span>{formatMoney(totalCents)}</span>
      </div>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Pagamento na retirada — online em breve.
      </p>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[var(--bone)]/95 p-4 backdrop-blur-md sm:static sm:mt-8 sm:border-0 sm:bg-transparent sm:p-0">
        <Link
          href="/checkout"
          className="flex w-full items-center justify-center rounded-md bg-[var(--flame)] px-4 py-3.5 font-semibold text-white hover:bg-[var(--flame-deep)]"
        >
          Continuar
        </Link>
      </div>
    </div>
  );
}
