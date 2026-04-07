import Link from "next/link";

const NAV = [
  { href: "/dashboard", label: "Огляд" },
  { href: "/dashboard/orders", label: "Замовлення" },
  { href: "/dashboard/favorites", label: "Обрані" },
  { href: "/dashboard/analytics", label: "Аналітика" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container-page grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="rounded-card border border-slate-200 bg-white p-3">
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
