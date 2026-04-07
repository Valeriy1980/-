import { ProductCard } from "./ProductCard";
import type { MockProduct } from "@/lib/mock/products";

export function ProductGrid({
  products,
  view,
}: {
  products: MockProduct[];
  view: "grid" | "list";
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-slate-300 bg-white p-10 text-center muted">
        Нічого не знайдено за обраними фільтрами.
      </div>
    );
  }

  if (view === "list") {
    return (
      <div className="flex flex-col gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} view="list" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} view="grid" />
      ))}
    </div>
  );
}
