import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { FilterSidebar } from "@/components/catalog/FilterSidebar";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { SearchBar } from "@/components/catalog/SearchBar";
import { SortSelect } from "@/components/catalog/SortSelect";
import { ViewToggle } from "@/components/catalog/ViewToggle";
import { Button } from "@/components/ui/button";
import { MOCK_PRODUCTS } from "@/lib/mock/products";
import { filterProducts, parseCatalogQuery } from "@/lib/catalog/filter";

export const metadata = { title: "Каталог" };

const PAGE_SIZE = 9;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const query = parseCatalogQuery(sp);
  const view = sp.view === "list" ? "list" : "grid";
  const pageRaw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Math.max(1, Number(pageRaw) || 1);
  const limit = PAGE_SIZE * page;

  const filtered = filterProducts(MOCK_PRODUCTS, query);
  const visible = filtered.slice(0, limit);
  const hasMore = filtered.length > visible.length;

  const nextParams = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v == null) continue;
    if (Array.isArray(v)) v.forEach((x) => nextParams.append(k, x));
    else nextParams.append(k, v);
  }
  nextParams.set("page", String(page + 1));

  return (
    <div className="container-page">
      <PageHeader
        title="Каталог товарів"
        description="Дані наразі мокові — після підключення Supabase сторінка автоматично перейде на реальний API."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar />
        <div className="flex items-center gap-3">
          <SortSelect />
          <ViewToggle />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <FilterSidebar />

        <section className="flex flex-col gap-4">
          <div className="text-sm muted">
            Знайдено товарів: <b className="text-ink">{filtered.length}</b>
          </div>

          <ProductGrid products={visible} view={view} />

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Link href={`/catalog?${nextParams.toString()}`} scroll={false}>
                <Button variant="outline" size="lg">
                  Показати ще
                </Button>
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
