/**
 * Парсер сторінки товару.
 *
 * Стратегія:
 * 1) Шукаємо JSON-LD `Product` — найнадійніше джерело (schema.org).
 * 2) Доповнюємо CSS-селекторами для тих полів, яких немає в JSON-LD.
 * 3) Якщо щось не знайдено — лишаємо null/undefined; transform-крок це обробить.
 *
 * ВАЖЛИВО: CSS-селектори зі змінних `FALLBACK_*` нижче можуть потребувати
 * налаштування під реальну розмітку сайту після першого тестового запуску.
 */
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";

export interface RawProduct {
  url: string;
  source_id?: string | null;
  name: string;
  sku?: string | null;
  brand?: string | null;
  category_path: string[]; // breadcrumb або хлібні крихти
  description_short?: string | null;
  description_full?: string | null;
  retail_price?: number | null;
  promo_price?: number | null;
  currency?: string | null;
  in_stock?: boolean | null;
  images: string[]; // абсолютні URL
  attributes: { name: string; value: string }[];
}

interface JsonLdProduct {
  "@type"?: string | string[];
  name?: string;
  sku?: string;
  mpn?: string;
  productID?: string;
  brand?: { name?: string } | string;
  description?: string;
  image?: string | string[];
  offers?: {
    price?: string | number;
    priceCurrency?: string;
    availability?: string;
  } | Array<{
    price?: string | number;
    priceCurrency?: string;
    availability?: string;
  }>;
  additionalProperty?: Array<{ name?: string; value?: string }>;
  category?: string;
}

function isProductLd(obj: unknown): obj is JsonLdProduct {
  if (!obj || typeof obj !== "object") return false;
  const t = (obj as JsonLdProduct)["@type"];
  if (Array.isArray(t)) return t.includes("Product");
  return t === "Product";
}

function findProductLd($: CheerioAPI): JsonLdProduct | null {
  const nodes = $('script[type="application/ld+json"]').toArray();
  for (const node of nodes) {
    const text = $(node).text().trim();
    if (!text) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      continue;
    }
    // Може бути об'єкт, масив, або @graph
    const candidates: unknown[] = Array.isArray(parsed)
      ? parsed
      : (parsed as { "@graph"?: unknown[] })["@graph"]
        ? (parsed as { "@graph": unknown[] })["@graph"]
        : [parsed];
    for (const c of candidates) {
      if (isProductLd(c)) return c;
    }
  }
  return null;
}

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/[^\d.,-]/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function absoluteUrl(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

// CSS-fallback селектори. Налаштувати після першого тестового запуску.
const FALLBACK = {
  name: "h1, .product-title, [itemprop='name']",
  sku: "[itemprop='sku'], .sku, .product-sku",
  price: "[itemprop='price'], .price, .product-price",
  oldPrice: ".old-price, .price-old, del .price",
  shortDesc: ".product-description-short, .short-description, [itemprop='description']",
  fullDesc: ".product-description, .description-full, .product-content",
  images: ".product-gallery img, .product-images img, [itemprop='image']",
  breadcrumbs: ".breadcrumb a, .breadcrumbs a, nav.breadcrumb a",
  attrRows: ".product-attributes tr, .specifications tr, table.specs tr, .characteristics li",
  brand: "[itemprop='brand'], .brand, .product-brand",
  inStock: "[itemprop='availability'], .in-stock, .availability",
};

export function parseProduct(html: string, url: string): RawProduct {
  const $ = cheerio.load(html);
  const ld = findProductLd($);

  // ---------- Назва ----------
  const name =
    ld?.name?.trim() ||
    $(FALLBACK.name).first().text().trim() ||
    $("title").text().trim();

  // ---------- SKU ----------
  const sku =
    ld?.sku ||
    ld?.mpn ||
    ld?.productID ||
    $(FALLBACK.sku).first().text().trim() ||
    null;

  // ---------- Бренд ----------
  let brand: string | null = null;
  if (ld?.brand) {
    brand = typeof ld.brand === "string" ? ld.brand : ld.brand.name ?? null;
  }
  if (!brand) {
    brand = $(FALLBACK.brand).first().text().trim() || null;
  }

  // ---------- Опис ----------
  const description_short =
    ld?.description?.trim() ||
    $(FALLBACK.shortDesc).first().text().trim() ||
    null;
  const description_full =
    $(FALLBACK.fullDesc).first().html()?.trim() || description_short;

  // ---------- Ціна ----------
  let retail_price: number | null = null;
  let currency: string | null = null;
  let in_stock: boolean | null = null;
  if (ld?.offers) {
    const offer = Array.isArray(ld.offers) ? ld.offers[0] : ld.offers;
    retail_price = toNumber(offer?.price);
    currency = offer?.priceCurrency ?? null;
    if (offer?.availability) {
      in_stock = /InStock/i.test(offer.availability);
    }
  }
  if (retail_price == null) {
    retail_price = toNumber($(FALLBACK.price).first().text());
  }
  const promo_price = toNumber($(FALLBACK.oldPrice).first().text());
  // Якщо є "стара ціна" — вона була до знижки, тож swap
  let finalRetail = retail_price;
  let finalPromo: number | null = null;
  if (promo_price != null && retail_price != null && promo_price > retail_price) {
    finalRetail = promo_price;
    finalPromo = retail_price;
  }

  // ---------- Фото ----------
  const imageSet = new Set<string>();
  if (ld?.image) {
    const arr = Array.isArray(ld.image) ? ld.image : [ld.image];
    for (const img of arr) imageSet.add(absoluteUrl(img, url));
  }
  $(FALLBACK.images).each((_, el) => {
    const src =
      $(el).attr("data-src") || $(el).attr("data-original") || $(el).attr("src");
    if (src && !src.startsWith("data:")) {
      imageSet.add(absoluteUrl(src, url));
    }
  });
  const images = [...imageSet];

  // ---------- Категорія ----------
  const category_path: string[] = [];
  $(FALLBACK.breadcrumbs).each((_, el) => {
    const t = $(el).text().trim();
    if (t && t.toLowerCase() !== "головна") category_path.push(t);
  });
  // Видаляємо назву товару з кінця хлібних крихт, якщо вона там є
  if (
    category_path.length > 0 &&
    name &&
    category_path[category_path.length - 1].toLowerCase() === name.toLowerCase()
  ) {
    category_path.pop();
  }
  if (category_path.length === 0 && ld?.category) {
    category_path.push(ld.category);
  }

  // ---------- Характеристики ----------
  const attributes: { name: string; value: string }[] = [];
  if (ld?.additionalProperty) {
    for (const p of ld.additionalProperty) {
      if (p.name && p.value) attributes.push({ name: p.name, value: p.value });
    }
  }
  if (attributes.length === 0) {
    $(FALLBACK.attrRows).each((_, el) => {
      const $el = $(el);
      const cells = $el.find("td, th");
      let n = "";
      let v = "";
      if (cells.length >= 2) {
        n = $(cells[0]).text().trim();
        v = $(cells[1]).text().trim();
      } else {
        // li → "Назва: Значення"
        const text = $el.text().trim();
        const idx = text.indexOf(":");
        if (idx > 0) {
          n = text.slice(0, idx).trim();
          v = text.slice(idx + 1).trim();
        }
      }
      if (n && v) attributes.push({ name: n, value: v });
    });
  }

  return {
    url,
    source_id: sku,
    name,
    sku,
    brand,
    category_path,
    description_short,
    description_full,
    retail_price: finalRetail,
    promo_price: finalPromo,
    currency,
    in_stock,
    images,
    attributes,
  };
}
