import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "Каталог" };

export default function CatalogPage() {
  return (
    <div className="container-page">
      <PageHeader
        title="Каталог товарів"
        description="Фільтри, сортування та реальні залишки. Дані буде підключено на Етапі 2."
      />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-card border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold">Фільтри</div>
          <p className="mt-2 text-xs muted">
            Категорія · Бренд · Ціна · Наявність · Характеристики
          </p>
        </aside>
        <section className="rounded-card border border-dashed border-slate-300 bg-white p-10 text-center muted">
          Сітка товарів буде доступна після підключення Supabase.
        </section>
      </div>
    </div>
  );
}
