import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Кошик" };

export default function CartPage() {
  return (
    <div className="container-page">
      <PageHeader title="Кошик" />
      <div className="rounded-card border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="muted">Ваш кошик поки порожній.</p>
        <Link href="/catalog" className="mt-4 inline-block">
          <Button>Перейти в каталог</Button>
        </Link>
      </div>
    </div>
  );
}
