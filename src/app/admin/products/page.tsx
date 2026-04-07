import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "Товари" };

export default function AdminProductsPage() {
  return (
    <>
      <PageHeader
        title="Управління товарами"
        description="CRUD товарів, фото, характеристики, імпорт."
      />
    </>
  );
}
