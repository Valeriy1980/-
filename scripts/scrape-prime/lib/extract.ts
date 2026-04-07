/**
 * Парсер сторінки товару.
 *
 * Стратегія:
 * 1) Шукаємо JSON-LD `Product` — найнадійніше джерело (schema.org).
 * 2) Wix має нестандартний JSON-LD: `Offers` з великої, `image` як ImageObject з
 *    полем `contentUrl`, `Availability` з великої.
 * 3) Якщо в JSON-LD немає бренду — використовуємо `seller.name` або дефолт.
 * 4) Опис нормалізуємо через cheerio (декод HTML-entities + strip тегів).
 */
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";

const DEFAULT_BRAND = "PRIME Technics";

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

// Wix не дотримується точно schema.org регістру (Offers, Availability — з великої).
// Тому всі поля парсимо через case-insensitive lookup.
type AnyObj = Record<string, unknown>;

function pick<T = unknown>(obj: AnyObj | null | undefined, ...keys: string[]): T | undefined {
  if (!obj) return undefined;
  for (const k of keys) {
    if (k in obj && obj[k] != null) return obj[k] as T;
    // case-insensitive
    const lower = k.toLowerCase();
    for (const ok of Object.keys(obj)) {
      if (ok.toLowerCase() === lower && obj[ok] != null) return obj[ok] as T;
    }
  }
  return undefined;
}

function isProductLd(obj: unknown): obj is AnyObj {
  if (!obj || typeof obj !== "object") return false;
  const t = (obj as AnyObj)["@type"];
  if (Array.isArray(t)) return t.includes("Product");
  return t === "Product";
}

function findProductLd($: CheerioAPI): AnyObj | null {
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
    const candidates: unknown[] = Array.isArray(parsed)
      ? parsed
      : (parsed as { "@graph"?: unknown[] })["@graph"]
        ? ((parsed as { "@graph": unknown[] })["@graph"] as unknown[])
        : [parsed];
    for (const c of candidates) {
      if (isProductLd(c)) return c as AnyObj;
    }
  }
  return null;
}

/**
 * Wix віддає зображення в URL виду
 *   .../w_500,h_500,q_90/file.png
 * Збільшуємо до 1200 — для каталогу/картки треба краща роздільність.
 */
function upscaleWixImage(url: string): string {
  return url.replace(/\/w_\d+,h_\d+,q_\d+\//, "/w_1200,h_1200,q_90/");
}

/**
 * Витягає всі URL зображень з поля JSON-LD `image`. Wix дає масив ImageObject
 * з полем `contentUrl`, але також підтримуємо звичайні рядки.
 */
function extractImageUrls(image: unknown, base: string): string[] {
  if (!image) return [];
  const out: string[] = [];
  const stack: unknown[] = [image];
  while (stack.length) {
    const item = stack.pop();
    if (!item) continue;
    if (typeof item === "string") {
      out.push(absoluteUrl(item, base));
      continue;
    }
    if (Array.isArray(item)) {
      for (const x of item) stack.push(x);
      continue;
    }
    if (typeof item === "object") {
      const obj = item as AnyObj;
      const url = pick<string>(obj, "contentUrl", "url", "@id");
      if (typeof url === "string") {
        out.push(absoluteUrl(url, base));
      }
    }
  }
  // Дедуплікація + збільшення роздільності для Wix CDN
  const unique = new Set(
    out.map((u) => (u.includes("wixstatic.com") ? upscaleWixImage(u) : u)),
  );
  return [...unique];
}

/**
 * Декодує HTML-entities (&#009;, &amp; тощо) і прибирає теги.
 */
function decodeHtmlText(input: string | null | undefined): string | null {
  if (!input) return null;
  const $ = cheerio.load(`<div>${input}</div>`);
  const text = $("div").text().replace(/\s+/g, " ").trim();
  return text || null;
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
    pick<string>(ld, "name")?.trim() ||
    $(FALLBACK.name).first().text().trim() ||
    $("title").text().trim();

  // ---------- SKU ----------
  const sku =
    pick<string>(ld, "sku", "mpn", "productID") ||
    $(FALLBACK.sku).first().text().trim() ||
    null;

  // ---------- Бренд ----------
  // Wix: справжнього бренду в JSON-LD немає, але є seller.name = "PRIME Technics"
  let brand: string | null = null;
  const ldBrand = pick<unknown>(ld, "brand");
  if (typeof ldBrand === "string") brand = ldBrand;
  else if (ldBrand && typeof ldBrand === "object") {
    brand = pick<string>(ldBrand as AnyObj, "name") ?? null;
  }
  if (!brand) {
    const offers = pick<AnyObj>(ld, "offers", "Offers");
    const seller = pick<AnyObj>(offers, "seller");
    brand = pick<string>(seller, "name") ?? null;
  }
  if (!brand) {
    brand = $(FALLBACK.brand).first().text().trim() || DEFAULT_BRAND;
  }

  // ---------- Опис ----------
  const description_short =
    decodeHtmlText(pick<string>(ld, "description")) ||
    decodeHtmlText($(FALLBACK.shortDesc).first().text()) ||
    null;
  const description_full =
    decodeHtmlText($(FALLBACK.fullDesc).first().html()) || description_short;

  // ---------- Ціна та наявність ----------
  let retail_price: number | null = null;
  let currency: string | null = null;
  let in_stock: boolean | null = null;
  const offer = pick<AnyObj | AnyObj[]>(ld, "offers", "Offers");
  const firstOffer = Array.isArray(offer) ? (offer[0] as AnyObj) : offer;
  if (firstOffer) {
    retail_price = toNumber(pick(firstOffer, "price"));
    currency = pick<string>(firstOffer, "priceCurrency") ?? null;
    const avail = pick<string>(firstOffer, "availability", "Availability");
    if (avail) in_stock = /InStock/i.test(avail);
  }
  if (retail_price == null) {
    retail_price = toNumber($(FALLBACK.price).first().text());
  }
  const promo_price = toNumber($(FALLBACK.oldPrice).first().text());
  let finalRetail = retail_price;
  let finalPromo: number | null = null;
  if (promo_price != null && retail_price != null && promo_price > retail_price) {
    finalRetail = promo_price;
    finalPromo = retail_price;
  }

  // ---------- Фото ----------
  const ldImages = extractImageUrls(pick(ld, "image"), url);
  const imageSet = new Set<string>(ldImages);
  $(FALLBACK.images).each((_, el) => {
    const src =
      $(el).attr("data-src") || $(el).attr("data-original") || $(el).attr("src");
    if (src && !src.startsWith("data:")) {
      imageSet.add(absoluteUrl(src, url));
    }
  });
  const images = [...imageSet];

  // ---------- Категорія (breadcrumbs) ----------
  // У Wix breadcrumbs зазвичай рендеряться JS — у статичному HTML їх немає.
  // Категорії будемо приписувати окремим етапом (з category-pages).
  const category_path: string[] = [];
  $(FALLBACK.breadcrumbs).each((_, el) => {
    const t = $(el).text().trim();
    if (t && t.toLowerCase() !== "головна") category_path.push(t);
  });
  if (
    category_path.length > 0 &&
    name &&
    category_path[category_path.length - 1].toLowerCase() === name.toLowerCase()
  ) {
    category_path.pop();
  }
  const ldCategory = pick<string>(ld, "category");
  if (category_path.length === 0 && ldCategory) {
    category_path.push(ldCategory);
  }

  // ---------- Характеристики ----------
  const attributes: { name: string; value: string }[] = [];
  const addProps = pick<Array<AnyObj>>(ld, "additionalProperty");
  if (Array.isArray(addProps)) {
    for (const p of addProps) {
      const n = pick<string>(p, "name");
      const v = pick<string>(p, "value");
      if (n && v) attributes.push({ name: n, value: v });
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
