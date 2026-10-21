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
      {/*
        Use svh (stable) not dvh — mobile URL bar show/hide was resizing the hero
        and making object-cover + transforms look like the image was changing.
      */}
      <section
        id="home-hero"
        className="relative isolate h-[calc(100svh-3.25rem)] max-h-[calc(100svh-3.25rem)] overflow-hidden"
      >
        <div className="absolute inset-0" aria-hidden>
          <Image
            src="/home/hero-bg.jpeg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_18%]"
          />
        </div>
        <div
          className="absolute inset-0 bg-gradient-to-t from-[var(--smoke)]/80 via-[var(--smoke)]/35 to-transparent"
          aria-hidden
        />

        {/* Pinned to the bottom of the hero so icons don't jump on scroll */}
        <div className="absolute inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-4 pb-12 pt-8 text-center sm:pb-16">
          <h1 className="sr-only">Forno e Fogão</h1>

          <div className="flex flex-wrap items-end justify-center gap-5 sm:gap-8">
            {PRODUCT_ICONS.map((item) => (
              <Link
                key={item.src}
                href={`/cardapio?categoria=${encodeURIComponent(item.categoria)}`}
                aria-label={`Pedir ${item.label}`}
                className="group flex flex-col items-center gap-2"
              >
                <span className="relative block overflow-hidden rounded-full shadow-lg ring-2 ring-white/50 transition group-active:scale-95 sm:group-hover:scale-105 sm:group-hover:ring-[var(--flame)]">
                  <Image
                    src={item.src}
                    alt=""
                    width={112}
                    height={112}
                    className="h-24 w-24 object-cover object-center sm:h-28 sm:w-28"
                    draggable={false}
                  />
                </span>
                <span className="text-sm font-semibold tracking-wide text-white/95 drop-shadow sm:text-base">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-8">
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
