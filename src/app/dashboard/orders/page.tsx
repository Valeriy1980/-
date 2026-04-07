import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "Мої замовлення" };

export default function DashboardOrdersPage() {
  return (
    <>
      <PageHeader title="Мої замовлення" />
      <div className="rounded-card border border-dashed border-slate-300 bg-white p-10 text-center muted">
        Поки немає замовлень.
      </div>
    </>
  );
}
