import Link from "next/link";

const NAV = [
  { href: "/admin", label: "Огляд" },
  { href: "/admin/products", label: "Товари" },
  { href: "/admin/orders", label: "Замовлення" },
  { href: "/admin/partners", label: "Партнери" },
  { href: "/admin/banners", label: "Банери" },
  { href: "/admin/analytics", label: "Аналітика" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container-page grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="rounded-card border border-slate-200 bg-white p-3">
        <div className="px-3 py-2 text-xs font-semibold uppercase muted">
          Адмін-панель
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-card px-3 py-2 text-sm hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section>{children}</section>
    </div>
  );
}
