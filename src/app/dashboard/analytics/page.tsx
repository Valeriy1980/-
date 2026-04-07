import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "Аналітика" };

export default function DashboardAnalyticsPage() {
  return (
    <>
      <PageHeader title="Аналітика замовлень" />
      <div className="rounded-card border border-dashed border-slate-300 bg-white p-10 text-center muted">
        Графіки буде додано на Етапі 7.
      </div>
    </>
  );
}
