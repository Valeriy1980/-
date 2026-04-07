import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "Порівняння" };

export default function ComparePage() {
  return (
    <div className="container-page">
      <PageHeader
        title="Порівняння товарів"
        description="До 4 товарів. Список зберігається у localStorage."
      />
      <div className="rounded-card border border-dashed border-slate-300 bg-white p-10 text-center muted">
        Список порівняння порожній.
      </div>
    </div>
  );
}
