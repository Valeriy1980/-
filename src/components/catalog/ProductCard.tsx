import Link from "next/link";
import { Heart, ShoppingCart, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatPrice } from "@/lib/utils";
import type { MockProduct } from "@/lib/mock/products";

interface Props {
  product: MockProduct;
  view?: "grid" | "list";
}

function StockBadge({ qty }: { qty: number }) {
  if (qty <= 0) return <Badge variant="muted">Під замовлення</Badge>;
  if (qty < 5) return <Badge variant="accent">Закінчується</Badge>;
  return <Badge variant="success">В наявності</Badge>;
}

function PriceBlock({ product }: { product: MockProduct }) {
  const hasPromo = product.is_promo && product.promo_price != null;
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-ink">
          {formatPrice(hasPromo ? product.promo_price! : product.retail_price)}
        </span>
        {hasPromo && (
          <span className="text-sm text-slate-400 line-through">
            {formatPrice(product.retail_price)}
          </span>
        )}
      </div>
    </div>
  );
}

function Thumb({ product, className }: { product: MockProduct; className?: string }) {
  const src = product.main_image?.image_url || "";
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-card bg-slate-100",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-contain p-3"
        />
      ) : (
        <span className="px-4 text-center text-xs uppercase tracking-wide text-slate-400">
          {product.brand.name}
        </span>
      )}
      <div className="absolute left-2 top-2 flex flex-col gap-1">
        {product.is_new && <Badge>Новинка</Badge>}
        {product.is_promo && <Badge variant="accent">Акція</Badge>}
      </div>
    </div>
  );
}

export function ProductCard({ product, view = "grid" }: Props) {
  if (view === "list") {
    return (
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 p-4 sm:flex-row">
          <Link
            href={`/product/${product.slug}`}
            className="block sm:w-48 sm:flex-shrink-0"
          >
            <Thumb product={product} className="aspect-square" />
          </Link>
          <div className="flex flex-1 flex-col">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              {product.brand.name} · {product.sku}
            </div>
            <Link
              href={`/product/${product.slug}`}
              className="mt-1 line-clamp-2 text-base font-semibold text-ink hover:text-brand"
            >
              {product.name}
            </Link>
            <p className="mt-1 line-clamp-2 text-sm muted">
              {product.description_short}
            </p>
            <div className="mt-3">
              <StockBadge qty={product.stock_quantity} />
            </div>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
              <PriceBlock product={product} />
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" aria-label="В обрані">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Порівняти">
                  <Scale className="h-5 w-5" />
                </Button>
                <Button>
                  <ShoppingCart className="h-5 w-5" />В кошик
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <Link href={`/product/${product.slug}`} className="block">
        <Thumb product={product} className="aspect-square" />
      </Link>
      <CardContent className="flex flex-1 flex-col gap-2">
        <div className="text-xs uppercase tracking-wide text-slate-400">
          {product.brand.name}
        </div>
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 min-h-[3rem] text-sm font-semibold text-ink hover:text-brand"
        >
          {product.name}
        </Link>
        <StockBadge qty={product.stock_quantity} />
        <div className="mt-auto pt-2">
          <PriceBlock product={product} />
          <Button className="mt-3 w-full">
            <ShoppingCart className="h-5 w-5" />В кошик
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
