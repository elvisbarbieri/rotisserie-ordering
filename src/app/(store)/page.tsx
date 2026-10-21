import Image from "next/image";
import Link from "next/link";
import { StickyPedirBar } from "@/components/store/StickyPedirBar";

const PRODUCT_ICONS = [
  {
    src: "/home/icon-frango.jpeg",
    label: "Frango",
    categoria: "FRANGO",
  },
  {
    src: "/home/icon-costela.jpeg",
    label: "Costela",
    categoria: "COSTELA",
  },
  {
    src: "/home/icon-porco.jpeg",
    label: "Porco",
    categoria: "PORCO",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <section
        id="home-hero"
        className="relative isolate min-h-[calc(100dvh-3.5rem)] overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          <Image
            src="/home/hero-bg.jpeg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-top translate-y-24 scale-[1.18] sm:translate-y-28"
          />
        </div>
        <div
          className="absolute inset-0 bg-gradient-to-t from-[var(--smoke)]/75 via-[var(--smoke)]/35 to-transparent"
          aria-hidden
        />
        <div className="relative mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-5xl flex-col items-center justify-end px-4 pb-14 pt-24 text-center sm:pb-20">
          <h1 className="sr-only">Forno e Fogão</h1>

          <div
            className="animate-rise flex flex-wrap items-end justify-center gap-5 sm:gap-8"
            style={{ animationDelay: "0.1s" }}
          >
            {PRODUCT_ICONS.map((item) => (
              <Link
                key={item.src}
                href={`/cardapio?categoria=${encodeURIComponent(item.categoria)}`}
                aria-label={`Pedir ${item.label}`}
                className="group flex flex-col items-center gap-2"
              >
                <span className="relative block overflow-hidden rounded-full shadow-lg ring-2 ring-white/50 transition group-hover:scale-105 group-hover:ring-[var(--flame)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--flame)]">
                  <Image
                    src={item.src}
                    alt=""
                    width={112}
                    height={112}
                    className="h-24 w-24 object-cover object-[center_72%] sm:h-28 sm:w-28"
                  />
                </span>
                <span className="text-sm font-semibold tracking-wide text-white/95 drop-shadow sm:text-base">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>

          <div className="animate-rise mt-8" style={{ animationDelay: "0.18s" }}>
            <Link
              href="/cardapio"
              className="inline-flex items-center justify-center rounded-md bg-[var(--flame)] px-7 py-3.5 text-base font-semibold text-white transition hover:bg-[var(--flame-deep)]"
            >
              Pedir agora
            </Link>
            <p className="mt-3 text-sm text-white/80 sm:text-base">
              Retire na loja · pague na retirada
            </p>
          </div>
        </div>
      </section>

      <StickyPedirBar />
    </>
  );
}
