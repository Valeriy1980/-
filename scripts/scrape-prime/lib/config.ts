/**
 * Конфігурація краулера. Усе в одному місці.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "../../..");

export const CONFIG = {
  baseUrl: "https://www.prime-technics.com",
  userAgent:
    "Mozilla/5.0 (compatible; ShowroomPortalBot/1.0; +https://github.com/valeriy1980)",
  concurrency: 3,
  throttleMs: 500,
  retries: 3,
  timeoutMs: 30_000,

  /**
   * Регулярка, що ідентифікує товарну сторінку.
   * Wix Stores: /product-page/<slug>
   * Shopify:    /products/<slug>
   * WooCommerce: /product/<slug>
   * Якщо null — використовується загальна евристика з looksLikeProductUrl().
   */
  productUrlPattern: /\/product-page\//,

  // Куди складати артефакти
  dataDir: path.join(ROOT, "data", "prime"),
  imagesDir: path.join(ROOT, "public", "imported"),

  // Файли-чекпойнти (resumable crawl)
  files: {
    urls: "urls.json", // знайдені URL товарів
    products: "products.json", // розпарсені товари
    categories: "categories.json",
    brands: "brands.json",
    enriched: "enriched.json", // AI-контент по товарах (stage 6)
    errors: "errors.log",
  },
} as const;

export function dataPath(name: keyof typeof CONFIG.files) {
  return path.join(CONFIG.dataDir, CONFIG.files[name]);
}

export function rawHtmlPath(slug: string) {
  return path.join(CONFIG.dataDir, "raw", `${slug}.html`);
}
