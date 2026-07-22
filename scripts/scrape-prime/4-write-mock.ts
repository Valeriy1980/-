/**
 * Етап 4: трансформувати products.json у формат src/lib/mock/products.ts.
 *
 * Це дозволяє побачити імпортовані товари в каталозі без Supabase.
 * Пізніше, коли буде Supabase, з тих самих data/prime/products.json напишемо
 * окремий import-to-supabase.ts (який заллє і дані, і фото в Storage).
 */
import path from "node:path";
import fs from "node:fs/promises";
import { dataPath, ROOT } from "./lib/config";
import { readJson } from "./lib/store";
import type { RawProduct } from "./lib/extract";

interface ProductsFile {
  scrapedAt: string;
  total: number;
  products: (RawProduct & { local_images?: string[] })[];
}

interface CategoriesFile {
  total: number;
  categories: Array<{
    slug: string;
    name: string;
    url: string;
    productUrls: string[];
  }>;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeStr(s: string | null | undefined): string {
  if (s == null) return "null";
  return JSON.stringify(s);
}

async function main() {
  const data = await readJson<ProductsFile | null>(dataPath("products"), null);
  if (!data || data.products.length === 0) {
    console.error("✗ Немає даних — спочатку запусти scrape:fetch");
    process.exit(1);
  }

  // Опціонально: AI-контент зі stage 6 (enrich). Якщо є — підхоплюємо описи.
  interface EnrichedShape {
    items?: Record<
      string,
      { description_short?: string; description_full?: string }
    >;
  }
  const enriched = await readJson<EnrichedShape | null>(
    dataPath("enriched"),
    null,
  );
  const enrichedItems = enriched?.items ?? {};
  if (Object.keys(enrichedItems).length > 0) {
    console.log(
      `  ✨ Підхоплено AI-контент для ${Object.keys(enrichedItems).length} товарів (enriched.json)`,
    );
  }

  // Опціонально: мапа категорій, отримана зі сторінок категорій (5-categories)
  const catData = await readJson<CategoriesFile | null>(
    dataPath("categories"),
    null,
  );
  // productUrl → categorySlug (перша знайдена категорія для товару)
  const productToCategorySlug = new Map<string, string>();
  if (catData) {
    for (const cat of catData.categories) {
      for (const pUrl of cat.productUrls) {
        if (!productToCategorySlug.has(pUrl)) {
          productToCategorySlug.set(pUrl, cat.slug);
        }
      }
    }
    console.log(
      `  ℹ Завантажено ${catData.categories.length} категорій, прив'язано ${productToCategorySlug.size} товарів`,
    );
  } else {
    console.log(
      "  ⚠ data/prime/categories.json відсутній — товари будуть без категорій. Запусти 'npm run scrape:categories'.",
    );
  }

  // ----- Категорії та бренди -----
  const categoriesMap = new Map<
    string,
    { id: string; name: string; slug: string; parent_id: string | null; sort_order: number }
  >();
  const brandsMap = new Map<string, { id: string; name: string; slug: string }>();

  let catCounter = 0;
  let brandCounter = 0;

  // Додаємо всі категорії з categories.json як готові
  if (catData) {
    for (const cat of catData.categories) {
      catCounter++;
      categoriesMap.set(cat.slug, {
        id: `c${catCounter}`,
        name: cat.name,
        slug: cat.slug,
        parent_id: null,
        sort_order: catCounter,
      });
    }
  }

  /**
   * Призначає category_id товару:
   * 1. Якщо є мапа з categories.json — беремо її
   * 2. Інакше — використовуємо category_path з парсингу breadcrumbs
   * 3. Інакше — "uncategorized"
   */
  function categoryIdForProduct(productUrl: string, fallbackPath: string[]): string {
    const slug = productToCategorySlug.get(productUrl);
    if (slug && categoriesMap.has(slug)) {
      return categoriesMap.get(slug)!.id;
    }
    const last = fallbackPath[fallbackPath.length - 1];
    if (!last) return "uncategorized";
    const fSlug = slugify(last);
    if (!categoriesMap.has(fSlug)) {
      catCounter++;
      categoriesMap.set(fSlug, {
        id: `c${catCounter}`,
        name: last,
        slug: fSlug,
        parent_id: null,
        sort_order: catCounter,
      });
    }
    return categoriesMap.get(fSlug)!.id;
  }

  // Гарантуємо наявність "Без категорії" як фолбеку для товарів без категорій.
  if (!categoriesMap.has("uncategorized")) {
    catCounter++;
    categoriesMap.set("uncategorized", {
      id: `c${catCounter}`,
      name: "Без категорії",
      slug: "uncategorized",
      parent_id: null,
      sort_order: 9999,
    });
  }

  function ensureBrand(name: string | null | undefined): string {
    const n = (name ?? "Без бренду").trim() || "Без бренду";
    const slug = slugify(n);
    if (!brandsMap.has(slug)) {
      brandCounter++;
      brandsMap.set(slug, { id: `b${brandCounter}`, name: n, slug });
    }
    return brandsMap.get(slug)!.id;
  }

  // ----- Товари -----
  interface OutProduct {
    id: string;
    name: string;
    slug: string;
    sku: string;
    brand_id: string;
    category_id: string;
    description_short: string | null;
    description_full: string | null;
    retail_price: number;
    wholesale_price: number | null;
    stock_quantity: number;
    status: "active";
    is_new: boolean;
    is_promo: boolean;
    promo_price: number | null;
    created_at: string;
    updated_at: string;
    images: string[];
  }

  const out: OutProduct[] = [];
  const usedSlugs = new Set<string>();
  let prodCounter = 0;

  for (const p of data.products) {
    if (!p.name) continue;
    prodCounter++;
    const baseSlug = slugify(p.name);
    let slug = baseSlug;
    let n = 2;
    while (usedSlugs.has(slug)) slug = `${baseSlug}-${n++}`;
    usedSlugs.add(slug);

    const category_id = categoryIdForProduct(p.url, p.category_path);
    const brand_id = ensureBrand(p.brand);
    const now = new Date().toISOString();

    // AI-контент має пріоритет над сирими описами зі скрапера.
    const ai = enrichedItems[p.url];

    out.push({
      id: `p${prodCounter}`,
      name: p.name,
      slug,
      sku: p.sku ?? `SKU-${prodCounter}`,
      brand_id,
      category_id,
      description_short: ai?.description_short ?? p.description_short ?? null,
      description_full: ai?.description_full ?? p.description_full ?? null,
      retail_price: p.retail_price ?? 0,
      wholesale_price: null,
      stock_quantity: p.in_stock === false ? 0 : 10,
      status: "active",
      is_new: false,
      is_promo: p.promo_price != null,
      promo_price: p.promo_price ?? null,
      created_at: now,
      updated_at: now,
      // Якщо локальні фото ще не завантажені (scrape:images не запущено) —
      // використовуємо оригінальні URL з Wix CDN. Це дає миттєвий результат
      // у каталозі без потреби качати ~2300 фото на диск.
      images: (p.local_images && p.local_images.length > 0
        ? p.local_images
        : p.images) ?? [],
    });
  }

  // ----- Генеруємо TS-файл -----
  const lines: string[] = [];
  lines.push("// AUTO-GENERATED by scripts/scrape-prime/4-write-mock.ts");
  lines.push("// Не редагуйте вручну — перезапишеться при наступному імпорті.");
  lines.push("");
  lines.push('import type { Brand, Category, Product, ProductImage } from "@/types";');
  lines.push("");

  lines.push("export const MOCK_CATEGORIES: Category[] = [");
  for (const c of categoriesMap.values()) {
    lines.push(
      `  { id: ${escapeStr(c.id)}, name: ${escapeStr(c.name)}, slug: ${escapeStr(c.slug)}, parent_id: null, image_url: null, sort_order: ${c.sort_order} },`,
    );
  }
  lines.push("];");
  lines.push("");

  lines.push("export const MOCK_BRANDS: Brand[] = [");
  for (const b of brandsMap.values()) {
    lines.push(
      `  { id: ${escapeStr(b.id)}, name: ${escapeStr(b.name)}, slug: ${escapeStr(b.slug)}, logo_url: null },`,
    );
  }
  lines.push("];");
  lines.push("");

  lines.push("interface MockProduct extends Product {");
  lines.push("  brand: Brand;");
  lines.push("  category: Category;");
  lines.push("  main_image: ProductImage;");
  lines.push("  images: string[];");
  lines.push("}");
  lines.push("");

  lines.push("const brandsById = new Map(MOCK_BRANDS.map((b) => [b.id, b]));");
  lines.push("const categoriesById = new Map(MOCK_CATEGORIES.map((c) => [c.id, c]));");
  lines.push("");

  lines.push("const RAW_PRODUCTS = [");
  for (const p of out) {
    lines.push("  {");
    for (const [k, v] of Object.entries(p)) {
      if (k === "images") continue;
      lines.push(`    ${k}: ${typeof v === "string" ? escapeStr(v) : JSON.stringify(v)},`);
    }
    lines.push(`    images: ${JSON.stringify(p.images)},`);
    lines.push("  },");
  }
  lines.push("] as const;");
  lines.push("");

  lines.push("export const MOCK_PRODUCTS: MockProduct[] = RAW_PRODUCTS.map((p) => {");
  lines.push("  const brand = brandsById.get(p.brand_id)!;");
  lines.push("  const category = categoriesById.get(p.category_id)!;");
  lines.push("  return {");
  lines.push("    ...p,");
  lines.push("    brand,");
  lines.push("    category,");
  lines.push("    main_image: {");
  lines.push("      id: `img-${p.id}`,");
  lines.push("      product_id: p.id,");
  lines.push("      image_url: p.images[0] ?? \"\",");
  lines.push("      sort_order: 0,");
  lines.push("      is_main: true,");
  lines.push("    },");
  lines.push("  };");
  lines.push("});");
  lines.push("");
  lines.push("export type { MockProduct };");
  lines.push("");

  const target = path.join(ROOT, "src", "lib", "mock", "products.ts");
  await fs.writeFile(target, lines.join("\n"), "utf8");

  console.log(`✔ Згенеровано ${out.length} товарів, ${categoriesMap.size} категорій, ${brandsMap.size} брендів`);
  console.log(`  → ${target}`);
  console.log(`\nДалі: npm run dev і відкрий /catalog`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
