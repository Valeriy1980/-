import type { MockProduct } from "@/lib/mock/products";
import type { SortValue } from "@/components/catalog/SortSelect";

export interface CatalogQuery {
  q?: string;
  categories?: string[];
  brands?: string[];
  min?: number;
  max?: number;
  stock?: "in" | "order" | "all";
  sort?: SortValue;
}

function effectivePrice(p: MockProduct) {
  return p.is_promo && p.promo_price != null ? p.promo_price : p.retail_price;
}

export function filterProducts(
  products: MockProduct[],
  q: CatalogQuery,
): MockProduct[] {
  let result = products.filter((p) => {
    if (q.categories && q.categories.length > 0 && !q.categories.includes(p.category.slug)) {
      return false;
    }
    if (q.brands && q.brands.length > 0 && !q.brands.includes(p.brand.slug)) {
      return false;
    }
    const price = effectivePrice(p);
    if (q.min != null && price < q.min) return false;
    if (q.max != null && price > q.max) return false;

    if (q.stock === "in" && p.stock_quantity <= 0) return false;
    if (q.stock === "order" && p.stock_quantity > 0) return false;

    if (q.q) {
      const needle = q.q.toLowerCase();
      const hay = `${p.name} ${p.sku} ${p.brand.name}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });

  switch (q.sort) {
    case "price-asc":
      result = [...result].sort((a, b) => effectivePrice(a) - effectivePrice(b));
      break;
    case "price-desc":
      result = [...result].sort((a, b) => effectivePrice(b) - effectivePrice(a));
      break;
    case "new":
      result = [...result].sort((a, b) =>
        b.created_at.localeCompare(a.created_at),
      );
      break;
    case "name":
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, "uk"));
      break;
    case "popular":
    default:
      // Mock-сортування: спочатку акції/новинки.
      result = [...result].sort((a, b) => {
        const score = (p: MockProduct) =>
          (p.is_promo ? 2 : 0) + (p.is_new ? 1 : 0);
        return score(b) - score(a);
      });
  }

  return result;
}

export function parseCatalogQuery(
  searchParams: Record<string, string | string[] | undefined>,
): CatalogQuery {
  const get = (k: string) => {
    const v = searchParams[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const getAll = (k: string): string[] => {
    const v = searchParams[k];
    if (v == null) return [];
    return Array.isArray(v) ? v : [v];
  };
  const num = (v: string | undefined) => {
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const stockRaw = get("stock");
  const stock: CatalogQuery["stock"] =
    stockRaw === "in" || stockRaw === "order" ? stockRaw : undefined;

  const sortRaw = get("sort");
  const sort = (
    ["popular", "new", "price-asc", "price-desc", "name"] as const
  ).find((s) => s === sortRaw);

  return {
    q: get("q") || undefined,
    categories: getAll("category"),
    brands: getAll("brand"),
    min: num(get("min")),
    max: num(get("max")),
    stock,
    sort,
  };
}
