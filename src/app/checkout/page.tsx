import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "Оформлення замовлення" };

export default function CheckoutPage() {
  return (
    <div className="container-page">
      <PageHeader
        title="Оформлення замовлення"
        description="Дані партнера, спосіб доставки та коментар."
      />
    </div>
  );
}
