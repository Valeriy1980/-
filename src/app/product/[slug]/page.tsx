import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="container-page">
      <PageHeader title={`Товар: ${decodeURIComponent(slug)}`} />
      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardContent className="aspect-square bg-slate-100" />
        </Card>
        <div className="space-y-4">
          <Badge variant="success">В наявності</Badge>
          <div className="text-3xl font-semibold">{formatPrice(12999)}</div>
          <p className="muted">
            Опис, характеристики та документи буде підвантажено з Supabase.
          </p>
          <div className="flex gap-3">
            <Button>Додати в кошик</Button>
            <Button variant="outline">До порівняння</Button>
            <Button variant="ghost">В обрані</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
