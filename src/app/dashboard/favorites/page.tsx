import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "Обрані товари" };

export default function DashboardFavoritesPage() {
  return (
    <>
      <PageHeader title="Обрані товари" />
      <div className="rounded-card border border-dashed border-slate-300 bg-white p-10 text-center muted">
        Список обраних порожній.
      </div>
    </>
  );
}
