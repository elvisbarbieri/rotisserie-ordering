"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Mobile sticky CTA that appears after the hero scrolls away. */
export function StickyPedirBar({ heroId = "home-hero" }: { heroId?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById(heroId);
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0.15 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [heroId]);

  return (
    <div
      className={`safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[var(--bone)]/95 p-3 backdrop-blur-md transition duration-300 md:hidden ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <Link
        href="/cardapio"
        tabIndex={visible ? 0 : -1}
        className="flex w-full items-center justify-center rounded-md bg-[var(--flame)] px-5 py-3.5 text-base font-semibold text-white"
      >
        Pedir agora
      </Link>
    </div>
  );
}
