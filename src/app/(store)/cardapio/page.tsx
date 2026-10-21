"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Item, formatMoney, storeApi } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { QtyStepper } from "@/components/store/QtyStepper";
import { ItemImage } from "@/components/store/ItemImage";

function CartIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="56"
      height="56"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function CardapioContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("TODOS");
  const { addItem, setQty, qtyOf, count, totalCents } = useCart();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await storeApi.listItems());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return ["TODOS", ...Array.from(set)];
  }, [items]);

  useEffect(() => {
    const raw = searchParams.get("categoria");
    if (!raw || items.length === 0) return;
    const wanted = raw.trim().toUpperCase();
    const match = categories.find(
      (c) => c !== "TODOS" && c.toUpperCase() === wanted
    );
    if (match) setCategory(match);
  }, [searchParams, items, categories]);

  const filtered = useMemo(
    () =>
      category === "TODOS"
        ? items
        : items.filter((i) => i.category === category),
    [items, category]
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-28">
      <h1 className="font-display animate-rise text-4xl text-[var(--ink)] sm:text-5xl">
        Cardápio
      </h1>
      <p
        className="animate-rise mt-2 text-[var(--muted)]"
        style={{ animationDelay: "0.08s" }}
      >
        Use + e − para montar seu pedido.
      </p>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium transition ${
              category === c
                ? "bg-[var(--ink)] text-white"
                : "bg-white text-[var(--ink-soft)] ring-1 ring-[var(--line)]"
            }`}
          >
            {c === "TODOS" ? "Tudo" : c}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      {loading && <p className="mt-8 text-[var(--muted)]">Carregando…</p>}

      <ul className="stagger mt-6 divide-y divide-[var(--line)]">
        {filtered.map((item) => {
          const qty = qtyOf(item.id);
          return (
            <li
              key={item.id}
              className="flex gap-4 py-5 sm:items-center sm:justify-between"
            >
              <ItemImage
                src={item.imageUrl}
                alt={item.name}
                className="h-20 w-20 shrink-0 rounded-md sm:h-24 sm:w-24"
              />
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl text-[var(--ink)]">
                  {item.name}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                  {item.description}
                </p>
                <p className="mt-2 font-semibold text-[var(--flame)]">
                  {formatMoney(item.priceCents)}
                </p>
              </div>
              <div className="shrink-0 self-center">
                <QtyStepper
                  qty={qty}
                  onIncrement={() =>
                    addItem({
                      itemId: item.id,
                      name: item.name,
                      unitPriceCents: item.priceCents,
                      imageUrl: item.imageUrl,
                    })
                  }
                  onDecrement={() => setQty(item.id, qty - 1)}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {!loading && filtered.length === 0 && (
        <p className="mt-8 text-[var(--muted)]">
          Nenhum item nesta categoria.{" "}
          <button
            type="button"
            className="underline"
            onClick={() => setCategory("TODOS")}
          >
            Ver tudo
          </button>
        </p>
      )}

      {count > 0 && (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[var(--bone)]/95 p-4 backdrop-blur-md">
          <Link
            href="/carrinho"
            className="flex h-16 w-full items-center justify-between gap-3 rounded-md bg-[var(--ink)] px-4 font-semibold text-white"
          >
            <span className="flex min-w-0 flex-col items-start text-left">
              <span className="text-base leading-tight sm:text-lg">
                Finalizar pedido
              </span>
              <span className="mt-0.5 text-sm font-medium leading-tight text-white/85 sm:text-base">
                {formatMoney(totalCents)}
              </span>
            </span>
            <span className="relative inline-flex h-14 w-14 shrink-0 items-center justify-center text-[#dc2626]">
              <CartIcon />
              <span className="absolute -right-1 -top-1 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#dc2626] px-1 text-sm font-bold leading-none text-white">
                {count}
              </span>
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function CardapioPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-8 text-[var(--muted)]">
          Carregando…
        </div>
      }
    >
      <CardapioContent />
    </Suspense>
  );
}
