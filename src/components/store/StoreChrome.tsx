"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";

function MenuIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h10" />
    </svg>
  );
}

function CartIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
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

export function StoreHeader() {
  const pathname = usePathname();
  const { count, justAdded } = useCart();

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-[var(--line)]/80 bg-[var(--bone)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center"
          aria-label="Forno e Fogão — início"
        >
          <Image
            src="/forno-fogao.jpg"
            alt="Forno e Fogão"
            width={72}
            height={72}
            className="h-10 w-10 rounded-md object-cover sm:h-14 sm:w-14"
            priority
          />
        </Link>
        <nav className="flex items-center gap-0.5 sm:gap-2">
          <Link
            href="/cardapio"
            aria-label="Cardápio"
            className={`relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition sm:px-3 sm:py-2 ${
              pathname?.startsWith("/cardapio")
                ? "text-[var(--flame)]"
                : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
            }`}
          >
            <MenuIcon />
            <span className="hidden sm:inline">Cardápio</span>
          </Link>
          <Link
            href="/carrinho"
            aria-label={`Pedido${count ? `, ${count} itens` : ""}`}
            className={`relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition sm:px-3 sm:py-2 ${
              pathname?.startsWith("/carrinho") || pathname?.startsWith("/checkout")
                ? "text-[var(--flame)]"
                : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
            }`}
          >
            <span className={justAdded ? "animate-cart-pop inline-flex items-center" : "inline-flex items-center"}>
              <CartIcon />
              <span className="ml-1.5 hidden sm:inline">Pedido</span>
              {count > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded bg-[var(--flame)] px-1 text-xs font-semibold text-white">
                  {count}
                </span>
              )}
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function StoreFooter() {
  return (
    <footer className="safe-bottom mt-auto border-t border-[var(--line)] bg-[var(--smoke)] text-[var(--ash)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-xl text-white">Forno e Fogão</p>
          <p className="mt-1 max-w-sm text-sm text-white/70">
            Frango no espeto, todos os dias. Retire na loja — pagamento na
            retirada.
          </p>
        </div>
        <p className="text-xs text-white/45">
          Equipe:{" "}
          <a href="/staff" className="underline underline-offset-2">
            balcão / cozinha
          </a>
        </p>
      </div>
    </footer>
  );
}
