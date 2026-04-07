import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Кабінет партнера" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Вітаємо у кабінеті партнера" />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent>
            <div className="text-sm muted">Замовлень за місяць</div>
            <div className="mt-1 text-2xl font-semibold">—</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-sm muted">Сума за місяць</div>
            <div className="mt-1 text-2xl font-semibold">
              {formatPrice(0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-sm muted">Обраних товарів</div>
            <div className="mt-1 text-2xl font-semibold">—</div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
