import Link from "next/link";
import { Grid3x3, Search, ShoppingCart, User } from "lucide-react";

const ITEMS = [
  { href: "/catalog", label: "Каталог", icon: Grid3x3 },
  { href: "/catalog?search=1", label: "Пошук", icon: Search },
  { href: "/cart", label: "Кошик", icon: ShoppingCart },
  { href: "/dashboard", label: "Кабінет", icon: User },
];

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white md:hidden">
      <ul className="grid grid-cols-4">
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex flex-col items-center gap-1 py-2 text-xs text-slate-600 hover:text-brand"
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
