"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/staff", label: "POS" },
  { href: "/staff/menu", label: "Cardápio" },
  { href: "/staff/orders", label: "Pedidos" },
  { href: "/staff/vendas", label: "Vendas" },
];

export function StaffNav() {
  const pathname = usePathname();
  return (
    <header className="border-b border-[var(--line)] bg-[var(--bone)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-baseline gap-3">
          <Link href="/staff" className="font-display text-2xl font-extrabold text-[var(--flame)]">
            Forno e Fogão
          </Link>
          <span className="text-sm text-[var(--muted)]">balcão</span>
        </div>
        <nav className="flex gap-1">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-[var(--flame)] text-white"
                    : "text-[var(--ink)] hover:bg-[var(--ash)]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <Link href="/" className="hidden text-sm text-[var(--muted)] underline sm:inline">
          Loja
        </Link>
      </div>
    </header>
  );
}
