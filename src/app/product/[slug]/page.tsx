import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart, Scale, Share2, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MOCK_PRODUCTS } from "@/lib/mock/products";
import { ProductGallery } from "@/components/product/ProductGallery";
import { formatPrice } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = MOCK_PRODUCTS.find((p) => p.slug === slug);
  return {
    title: product ? product.name : "Товар не знайдено",
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = MOCK_PRODUCTS.find((p) => p.slug === slug);
  if (!product) notFound();

  const hasPromo = product.is_promo && product.promo_price != null;
  const inStock = product.stock_quantity > 0;
  const images = (product as { images?: string[] }).images ?? [];

  return (
    <div className="container-page">
      {/* Хлібні крихти */}
      <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm muted">
        <Link href="/" className="hover:text-brand">
          Головна
        </Link>
        <span>›</span>
        <Link href="/catalog" className="hover:text-brand">
          Каталог
        </Link>
        <span>›</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* Галерея */}
        <ProductGallery images={images} alt={product.name} />

        {/* Інфо-блок */}
        <div className="space-y-5">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            {product.brand.name} {product.sku && `· арт. ${product.sku}`}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            {product.name}
          </h1>

          <div className="flex items-center gap-2">
            {inStock ? (
              <Badge variant="success">В наявності</Badge>
            ) : (
              <Badge variant="muted">Під замовлення</Badge>
            )}
            {product.is_new && <Badge>Новинка</Badge>}
            {product.is_promo && <Badge variant="accent">Акція</Badge>}
          </div>

          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-semibold text-ink">
                  {formatPrice(
                    hasPromo ? product.promo_price! : product.retail_price,
                  )}
                </span>
                {hasPromo && (
                  <span className="text-lg text-slate-400 line-through">
                    {formatPrice(product.retail_price)}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="flex-1 sm:flex-none">
                  <ShoppingCart className="h-5 w-5" />
                  Додати в кошик
                </Button>
                <Button variant="outline" size="lg" aria-label="До порівняння">
                  <Scale className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg" aria-label="В обрані">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg" aria-label="Поділитися">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {product.description_short && (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Опис
              </h2>
              <p className="leading-relaxed text-ink">
                {product.description_short}
              </p>
            </div>
          )}
        </div>
      </div>

      {product.description_full &&
        product.description_full !== product.description_short && (
          <section className="mt-10">
            <h2 className="h2 mb-3">Детальний опис</h2>
            <Card>
              <CardContent>
                <p className="leading-relaxed text-ink">
                  {product.description_full}
                </p>
              </CardContent>
            </Card>
          </section>
        )}
    </div>
  );
}
