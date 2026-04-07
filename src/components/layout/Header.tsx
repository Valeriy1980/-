import Link from "next/link";
import { Search, ShoppingCart, User } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/catalog", label: "Каталог" },
  { href: "/compare", label: "Порівняння" },
  { href: "/showroom", label: "Showroom" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <Link href="/" className="text-xl font-bold text-brand">
          {SITE_NAME}
        </Link>

        <nav className="hidden gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-card px-3 py-2 text-sm font-medium text-ink hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Пошук товарів..."
              className="h-10 w-72 rounded-card border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-brand"
            />
          </div>

          <Link href="/cart">
            <Button variant="ghost" size="icon" aria-label="Кошик">
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="icon" aria-label="Кабінет">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
