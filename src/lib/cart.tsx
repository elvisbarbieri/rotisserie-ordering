"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartLine } from "@/lib/api";

type CartContextValue = {
  lines: CartLine[];
  count: number;
  totalCents: number;
  addItem: (
    line: Omit<CartLine, "qty" | "notes"> & { qty?: number; notes?: string }
  ) => void;
  qtyOf: (itemId: string) => number;
  setQty: (itemId: string, qty: number) => void;
  setNotes: (itemId: string, notes: string) => void;
  remove: (itemId: string) => void;
  clear: () => void;
  justAdded: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "gira_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const addItem = useCallback(
    (line: Omit<CartLine, "qty" | "notes"> & { qty?: number; notes?: string }) => {
      setLines((prev) => {
        const existing = prev.find((l) => l.itemId === line.itemId);
        if (existing) {
          return prev.map((l) =>
            l.itemId === line.itemId
              ? { ...l, qty: l.qty + (line.qty ?? 1) }
              : l
          );
        }
        return [
          ...prev,
          {
            itemId: line.itemId,
            name: line.name,
            unitPriceCents: line.unitPriceCents,
            qty: line.qty ?? 1,
            notes: line.notes ?? "",
            imageUrl: line.imageUrl ?? null,
          },
        ];
      });
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 450);
    },
    []
  );

  const qtyOf = useCallback(
    (itemId: string) => lines.find((l) => l.itemId === itemId)?.qty ?? 0,
    [lines]
  );

  const setQty = useCallback((itemId: string, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.itemId === itemId ? { ...l, qty } : l))
        .filter((l) => l.qty > 0)
    );
  }, []);

  const setNotes = useCallback((itemId: string, notes: string) => {
    setLines((prev) =>
      prev.map((l) => (l.itemId === itemId ? { ...l, notes } : l))
    );
  }, []);

  const remove = useCallback((itemId: string) => {
    setLines((prev) => prev.filter((l) => l.itemId !== itemId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      totalCents: lines.reduce((n, l) => n + l.qty * l.unitPriceCents, 0),
      addItem,
      qtyOf,
      setQty,
      setNotes,
      remove,
      clear,
      justAdded,
    }),
    [lines, addItem, qtyOf, setQty, setNotes, remove, clear, justAdded]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
