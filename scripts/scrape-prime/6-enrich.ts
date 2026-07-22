/**
 * Етап 6: AI-збагачення каталогу.
 *
 * Читає data/prime/products.json, для кожного товару генерує контент через
 * Claude (див. lib/enrich.ts) і складає результат у data/prime/enriched.json,
 * ключований по URL товару.
 *
 * Resumable: товари, які вже є в enriched.json, пропускаються. Чекпойнт кожні
 * 10 товарів + запис у кінці. Помилки логуються, процес не зупиняється.
 *
 * Запускати на машині з ANTHROPIC_API_KEY та інтернетом:
 *   ENRICH_MODEL=claude-opus-4-8 npm run scrape:enrich
 */
import pLimit from "p-limit";
import { CONFIG, dataPath } from "./lib/config";
import { readJson, writeJson, appendError } from "./lib/store";
import type { RawProduct } from "./lib/extract";
import {
  createClient,
  enrichProduct,
  ENRICH_MODEL,
  type Enrichment,
} from "./lib/enrich";

interface ProductsFile {
  scrapedAt: string;
  total: number;
  products: (RawProduct & { local_images?: string[] })[];
}

export interface EnrichedFile {
  generatedAt: string;
  model: string;
  total: number;
  items: Record<string, Enrichment>;
}

const CONCURRENCY = Number(process.env.ENRICH_CONCURRENCY ?? 4);
const CHECKPOINT_EVERY = 10;

async function main() {
  const data = await readJson<ProductsFile | null>(dataPath("products"), null);
  if (!data || data.products.length === 0) {
    console.error("✗ Немає даних — спочатку запусти scrape:fetch");
    process.exit(1);
  }

  // Ключ ANTHROPIC_API_KEY обов'язковий (або активний профіль `ant`).
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    console.error(
      "✗ Немає ANTHROPIC_API_KEY. Додай ключ у .env.local або оточення.",
    );
    process.exit(1);
  }

  const existing = await readJson<EnrichedFile | null>(
    dataPath("enriched"),
    null,
  );
  const items: Record<string, Enrichment> = existing?.items ?? {};

  // Товари з іменем, які ще не збагачені.
  const todo = data.products.filter((p) => p.name && !items[p.url]);
  const already = Object.keys(items).length;

  console.log(
    `AI-збагачення: модель=${ENRICH_MODEL}, всього товарів=${data.products.length}, ` +
      `вже готово=${already}, до обробки=${todo.length}, паралельно=${CONCURRENCY}`,
  );
  if (todo.length === 0) {
    console.log("✔ Немає нових товарів для збагачення.");
    return;
  }

  const client = createClient();
  const limit = pLimit(CONCURRENCY);

  let done = 0;
  let failed = 0;
  let sinceCheckpoint = 0;

  const save = async () => {
    const out: EnrichedFile = {
      generatedAt: new Date().toISOString(),
      model: ENRICH_MODEL,
      total: Object.keys(items).length,
      items,
    };
    await writeJson(dataPath("enriched"), out);
  };

  await Promise.all(
    todo.map((product) =>
      limit(async () => {
        try {
          const enrichment = await enrichProduct(client, product);
          items[product.url] = enrichment;
          done++;
          sinceCheckpoint++;
          console.log(`  ✓ [${done + failed}/${todo.length}] ${product.name}`);
        } catch (err) {
          failed++;
          const msg = (err as Error).message ?? String(err);
          console.warn(`  ✗ ${product.name} — ${msg}`);
          await appendError(
            dataPath("errors"),
            `enrich "${product.url}" — ${msg}`,
          );
        }
        if (sinceCheckpoint >= CHECKPOINT_EVERY) {
          sinceCheckpoint = 0;
          await save();
        }
      }),
    ),
  );

  await save();

  console.log(
    `\n✔ Готово: збагачено ${done}, помилок ${failed}. → ${dataPath("enriched")}`,
  );
  if (failed > 0) {
    console.log(
      `  ℹ Помилки у ${CONFIG.files.errors}. Повторний запуск обробить лише невдалі товари.`,
    );
  }
  console.log("\nДалі: npm run scrape:mock (підхопить описи) і npm run dev");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
