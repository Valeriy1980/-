/**
 * Етап 1: знайти всі URL товарів.
 *
 * Стратегія:
 *   1. Завантажити /robots.txt → витягти Sitemap: ...
 *   2. Якщо немає — спробувати стандартні /sitemap.xml, /sitemap_index.xml
 *   3. Рекурсивно розгорнути sitemap-індекси (вкладені <sitemap>)
 *   4. Зібрати всі <loc> зі всіх дочірніх sitemap-ів
 *   5. Відфільтрувати ті, що схожі на товарні (евристика — налаштовується)
 *
 * Результат → data/prime/urls.json
 */
import * as cheerio from "cheerio";
import { CONFIG, dataPath } from "./lib/config";
import { fetchUrl } from "./lib/http";
import { writeJson } from "./lib/store";

async function getSitemapsFromRobots(): Promise<string[]> {
  try {
    const txt = (await fetchUrl(`${CONFIG.baseUrl}/robots.txt`)) as string;
    const sitemaps: string[] = [];
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*Sitemap:\s*(\S+)/i);
      if (m) sitemaps.push(m[1]);
    }
    return sitemaps;
  } catch {
    return [];
  }
}

async function expandSitemap(url: string, into: Set<string>) {
  console.log(`  sitemap: ${url}`);
  let xml: string;
  try {
    xml = (await fetchUrl(url)) as string;
  } catch (err) {
    console.warn(`    failed: ${(err as Error).message}`);
    return;
  }
  const $ = cheerio.load(xml, { xmlMode: true });

  // Sitemap-індекс
  const indexLocs = $("sitemapindex > sitemap > loc")
    .map((_, el) => $(el).text().trim())
    .get();
  if (indexLocs.length > 0) {
    for (const loc of indexLocs) await expandSitemap(loc, into);
    return;
  }

  // Звичайний sitemap
  $("urlset > url > loc").each((_, el) => {
    const loc = $(el).text().trim();
    if (loc) into.add(loc);
  });
}

/**
 * Евристика: чи URL схожий на товарний.
 * Налаштувати після першого запуску, коли побачимо реальні URL.
 */
function looksLikeProductUrl(url: string): boolean {
  const lower = url.toLowerCase();
  // Виключаємо очевидно НЕ товарні
  if (/\.(jpg|jpeg|png|gif|webp|pdf|css|js|xml)(\?|$)/.test(lower)) return false;
  if (/\/(blog|news|page|category|categor|brand|search|cart|account|login|sitemap)/.test(
      lower,
  )) {
    return false;
  }
  // Простий ствердник: URL має хоча б 2 сегменти й закінчується чимось схожим на slug
  try {
    const u = new URL(url);
    const segments = u.pathname.split("/").filter(Boolean);
    if (segments.length < 1) return false;
    const last = segments[segments.length - 1];
    // slug: букви/цифри/дефіс, не порожній
    return /^[\w-]+$/.test(last) && last.length >= 3;
  } catch {
    return false;
  }
}

async function main() {
  console.log(`▶ Discover URLs on ${CONFIG.baseUrl}`);
  const sitemaps = await getSitemapsFromRobots();
  if (sitemaps.length === 0) {
    sitemaps.push(`${CONFIG.baseUrl}/sitemap.xml`);
    sitemaps.push(`${CONFIG.baseUrl}/sitemap_index.xml`);
  }

  const allUrls = new Set<string>();
  for (const sm of sitemaps) {
    await expandSitemap(sm, allUrls);
  }

  console.log(`  знайдено ${allUrls.size} URL у sitemap(s)`);
  const productUrls = [...allUrls].filter(looksLikeProductUrl).sort();
  console.log(`  з них схожі на товарні: ${productUrls.length}`);

  await writeJson(dataPath("urls"), {
    discoveredAt: new Date().toISOString(),
    total: productUrls.length,
    urls: productUrls,
  });
  console.log(`✔ Saved → ${dataPath("urls")}`);
  if (productUrls.length === 0) {
    console.warn(
      "\n⚠ Жодних товарних URL не знайдено. Перевірте евристику в looksLikeProductUrl(),\n" +
        "  а також що sitemap взагалі існує і доступний.",
    );
  } else if (productUrls.length < 10) {
    console.warn(
      "\n⚠ Знайдено дуже мало URL. Можливо, евристика занадто строга — гляньте data/prime/urls.json,\n" +
        "  скиньте кілька прикладів URL і ми підкоригуємо looksLikeProductUrl().",
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
