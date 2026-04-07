/**
 * Етап 5: збір категорій.
 *
 * Wix не рендерить breadcrumbs у статичному HTML, але категорія = окрема
 * сторінка зі списком товарів. Підхід:
 *
 * 1. Беремо всі URL з sitemap, які НЕ є /product-page/ і не з blacklist.
 * 2. Завантажуємо HTML кожного.
 * 3. Знаходимо всі посилання /product-page/<slug> на сторінці.
 * 4. Якщо ≥3 — це сторінка категорії. Витягуємо назву з h1/title.
 * 5. Будуємо мапу categorySlug → [productUrls].
 *
 * Результат → data/prime/categories.json
 */
import * as cheerio from "cheerio";
import { CONFIG, dataPath } from "./lib/config";
import { fetchUrl } from "./lib/http";
import { appendError, readJson, writeJson } from "./lib/store";
import path from "node:path";

interface UrlsFile {
  total: number;
  urls: string[];
}

interface Category {
  slug: string;
  name: string;
  url: string;
  productUrls: string[];
}

interface CategoriesFile {
  discoveredAt: string;
  total: number;
  categories: Category[];
}

// Сторінки, які точно не є категоріями (контакти, акції, інформаційні).
const PAGE_BLOCKLIST =
  /\/(contacts|de-kupiti|sertifikat|garantiya|garantia|garantii|spivpracya|akciy-|catalog$|service|servisniy|news|blog|about|home|test|foto-|video|policy|terms|cookie|404|search)/i;

async function fetchAllSitemapUrls(): Promise<string[]> {
  const sitemapIndex = `${CONFIG.baseUrl}/sitemap.xml`;
  const out = new Set<string>();
  const seen = new Set<string>();
  const queue = [sitemapIndex];

  while (queue.length) {
    const url = queue.shift()!;
    if (seen.has(url)) continue;
    seen.add(url);
    let xml: string;
    try {
      xml = (await fetchUrl(url)) as string;
    } catch (err) {
      console.warn(`  ✗ ${url}: ${(err as Error).message}`);
      continue;
    }
    const $ = cheerio.load(xml, { xmlMode: true });
    const indexLocs = $("sitemapindex > sitemap > loc")
      .map((_, el) => $(el).text().trim())
      .get();
    if (indexLocs.length > 0) {
      queue.push(...indexLocs);
      continue;
    }
    $("urlset > url > loc").each((_, el) => {
      const loc = $(el).text().trim();
      if (loc) out.add(loc);
    });
  }

  return [...out];
}

async function main() {
  console.log("▶ Збір категорій з prime-technics.com");

  const allUrls = await fetchAllSitemapUrls();
  console.log(`  знайдено ${allUrls.length} URL у sitemaps`);

  // Кандидати в категорії: НЕ /product-page/, НЕ в blocklist
  const candidates = allUrls.filter((u) => {
    if (/\/product-page\//.test(u)) return false;
    if (PAGE_BLOCKLIST.test(u)) return false;
    // Не корінь /
    try {
      const path = new URL(u).pathname;
      if (path === "/" || path.length < 2) return false;
    } catch {
      return false;
    }
    return true;
  });

  console.log(`  кандидатів на категорії: ${candidates.length}`);
  console.log();

  const categories: Category[] = [];
  let processed = 0;

  for (const url of candidates) {
    processed++;
    let html: string;
    try {
      html = (await fetchUrl(url)) as string;
    } catch (err) {
      await appendError(
        path.join(CONFIG.dataDir, CONFIG.files.errors),
        `CATEGORY  ${url}  ${(err as Error).message}`,
      );
      console.warn(`  [${processed}/${candidates.length}] ✗ ${url}`);
      continue;
    }
    const $ = cheerio.load(html);

    // Збираємо всі унікальні /product-page/ посилання на сторінці
    const productUrls = new Set<string>();
    $('a[href*="/product-page/"]').each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      try {
        const abs = new URL(href, url).toString();
        // Прибираємо query/fragment (часто Wix додає ?referrer тощо)
        const cleaned = abs.split("#")[0].split("?")[0];
        if (/\/product-page\//.test(cleaned)) productUrls.add(cleaned);
      } catch {
        /* ignore */
      }
    });

    if (productUrls.size < 3) {
      // Не схоже на категорію
      continue;
    }

    // Назва категорії: <title> зазвичай має формат "Category Name | Site Name"
    let name =
      $("title").text().split(/[|·—]/)[0].trim() ||
      $("h1").first().text().trim() ||
      "";
    if (!name) {
      const slug = new URL(url).pathname.replace(/^\//, "");
      name = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
    // Інколи в title пишуть "PRIME Technics" — пропускаємо такі
    if (/^prime/i.test(name)) {
      name = $("h1").first().text().trim() || name;
    }

    const slug = new URL(url).pathname.replace(/^\//, "").replace(/\/$/, "");

    categories.push({
      slug,
      name,
      url,
      productUrls: [...productUrls],
    });
    console.log(
      `  [${processed}/${candidates.length}] ✓ ${name} → ${productUrls.size} товарів`,
    );
  }

  // Записуємо
  const data: CategoriesFile = {
    discoveredAt: new Date().toISOString(),
    total: categories.length,
    categories,
  };
  await writeJson(dataPath("categories"), data);

  console.log();
  console.log(`✔ Знайдено ${categories.length} категорій`);

  // Інверсна мапа: продукт → категорії
  const productToCats = new Map<string, string[]>();
  for (const cat of categories) {
    for (const pUrl of cat.productUrls) {
      const arr = productToCats.get(pUrl) ?? [];
      arr.push(cat.slug);
      productToCats.set(pUrl, arr);
    }
  }
  console.log(`  Прив'язано ${productToCats.size} унікальних товарів`);
  console.log(`  → ${dataPath("categories")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
