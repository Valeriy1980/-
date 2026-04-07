import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { SITE_NAME } from "@/lib/constants";

const inter = Inter({ subsets: ["latin", "cyrillic"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — Цифровий шоурум для партнерів`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Веб-портал для роздрібних магазинів побутової техніки: каталог, ціни, залишки та замовлення.",
  manifest: "/manifest.webmanifest",
  applicationName: SITE_NAME,
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" className={inter.className}>
      <body className="min-h-screen bg-surface text-ink">
        <Header />
        <main className="pb-24 md:pb-0">{children}</main>
        <Footer />
        <MobileNav />
      </body>
    </html>
  );
}
