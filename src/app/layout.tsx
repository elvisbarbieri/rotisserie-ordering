import type { Metadata, Viewport } from "next";
import { Syne, Figtree } from "next/font/google";
import { CartProvider } from "@/lib/cart";
import "./globals.css";

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const body = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Forno e Fogão",
    template: "%s · Forno e Fogão",
  },
  description:
    "Frango no espeto, quente e crocante. Peça online e retire na loja.",
  applicationName: "Forno e Fogão",
  appleWebApp: {
    capable: true,
    title: "Forno e Fogão",
    statusBarStyle: "black-translucent",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a100c",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
