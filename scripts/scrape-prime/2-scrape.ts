/**
 * Етап 2: для кожного URL з urls.json — завантажити HTML, розпарсити, зберегти.
 *
 * - Зберігає сирий HTML у data/prime/raw/<slug>.html (resumable: при повторному
 *   запуску використовує кешований HTML, якщо він є).
 * - Записує products.json після кожних N товарів (чекпойнт).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { CONFIG, dataPath, rawHtmlPath } from "./lib/config";
import { fetchUrl } from "./lib/http";
import { parseProduct, type RawProduct } from "./lib/extract";
import { appendError, ensureDir, readJson, writeJson } from "./lib/store";

const CHECKPOINT_EVERY = 25;

interface UrlsFile {
  total: number;
  urls: string[];
}

interface ProductsFile {
  scrapedAt: string;
  total: number;
  products: RawProduct[];
}

function urlToSlug(url: string): string {
  try {
    const u = new URL(url);
    const segments = u.pathname.split("/").filter(Boolean);
    return segments.join("__") || "index";
  } catch {
    return url.replace(/[^\w]+/g, "_");
  }
}

async function loadOrFetchHtml(url: string): Promise<string> {
  const slug = urlToSlug(url);
  const cached = rawHtmlPath(slug);
  try {
    return await fs.readFile(cached, "utf8");
  } catch {
    /* not cached */
  }
  const html = (await fetchUrl(url)) as string;
  await ensureDir(path.dirname(cached));
  await fs.writeFile(cached, html, "utf8");
  return html;
}

async function main() {
  const urlsData = await readJson<UrlsFile | null>(dataPath("urls"), null);
  if (!urlsData || urlsData.urls.length === 0) {
    console.error("✗ data/prime/urls.json порожній або відсутній — спочатку запусти scrape:discover");
    process.exit(1);
  }

  const existing = await readJson<ProductsFile>(dataPath("products"), {
    scrapedAt: new Date().toISOString(),
    total: 0,
    products: [],
  });
  const done = new Set(existing.products.map((p) => p.url));
  const products: RawProduct[] = [...existing.products];

  console.log(
    `▶ Scraping ${urlsData.urls.length} products (вже зроблено: ${done.size})`,
  );

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  // Запускаємо паралельно через fetchUrl, але parsing — послідовно
  const tasks = urlsData.urls
    .filter((u) => !done.has(u))
    .map(async (url) => {
      try {
        const html = await loadOrFetchHtml(url);
        const product = parseProduct(html, url);
        products.push(product);
        succeeded++;
        if (!product.name || !product.images.length) {
          console.warn(
            `  ⚠ ${url} — name="${product.name}", images=${product.images.length}`,
          );
        }
      } catch (err) {
        failed++;
        const msg = (err as Error).message;
        await appendError(
          path.join(CONFIG.dataDir, CONFIG.files.errors),
          `SCRAPE  ${url}  ${msg}`,
        );
        console.warn(`  ✗ ${url} — ${msg}`);
      } finally {
        processed++;
        if (processed % CHECKPOINT_EVERY === 0) {
          await writeJson(dataPath("products"), {
            scrapedAt: new Date().toISOString(),
            total: products.length,
            products,
          });
          console.log(
            `  … ${processed}/${urlsData.urls.length - done.size} (ok=${succeeded} fail=${failed})`,
          );
        }
      }
    });

  await Promise.all(tasks);

  await writeJson(dataPath("products"), {
    scrapedAt: new Date().toISOString(),
    total: products.length,
    products,
  });

  console.log(
    `✔ Збережено ${products.length} товарів → ${dataPath("products")}`,
  );
  console.log(`  ok=${succeeded}  fail=${failed}`);
  if (failed > 0) {
    console.log(`  Помилки: ${path.join(CONFIG.dataDir, CONFIG.files.errors)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
