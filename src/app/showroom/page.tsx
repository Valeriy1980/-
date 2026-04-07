import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "Showroom-режим" };

export default function ShowroomPage() {
  return (
    <div className="container-page">
      <PageHeader
        title="Showroom-режим"
        description="Демонстрація товарів покупцю — тільки роздрібні ціни."
      />
    </div>
  );
}
