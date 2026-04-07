/**
 * Етап 3: завантаження зображень.
 *
 * - Кожне фото зберігається як public/imported/<sku>/<index>.<ext>
 * - Дедуплікація за SHA-1 хешем (один файл — одне місце на диску)
 * - Resumable: якщо файл уже є, пропускаємо
 * - У products.json дописується поле `local_images: string[]` з відносними шляхами
 */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { CONFIG, dataPath } from "./lib/config";
import { fetchUrl } from "./lib/http";
import { appendError, ensureDir, readJson, writeJson } from "./lib/store";
import type { RawProduct } from "./lib/extract";

interface ProductsFile {
  scrapedAt: string;
  total: number;
  products: (RawProduct & { local_images?: string[] })[];
}

function extFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\.([a-z0-9]{2,5})$/i);
    return m ? m[1].toLowerCase() : "jpg";
  } catch {
    return "jpg";
  }
}

function safeFolder(sku: string | null | undefined, fallback: string): string {
  const base = (sku || fallback).replace(/[^\w-]+/g, "-").slice(0, 80);
  return base || "no-sku";
}

async function downloadImage(url: string, dest: string): Promise<void> {
  try {
    await fs.access(dest);
    return; // вже завантажено
  } catch {
    /* fall through */
  }
  const buf = (await fetchUrl(url, { asBuffer: true })) as Buffer;
  await ensureDir(path.dirname(dest));
  await fs.writeFile(dest, buf);
}

async function main() {
  const data = await readJson<ProductsFile | null>(dataPath("products"), null);
  if (!data || data.products.length === 0) {
    console.error("✗ data/prime/products.json порожній — спочатку запусти scrape:fetch");
    process.exit(1);
  }

  console.log(`▶ Downloading images for ${data.products.length} products`);
  let imgOk = 0;
  let imgFail = 0;

  for (let i = 0; i < data.products.length; i++) {
    const p = data.products[i];
    const folder = safeFolder(p.sku, `prod-${i}`);
    const localPaths: string[] = [];

    for (let j = 0; j < p.images.length; j++) {
      const src = p.images[j];
      const ext = extFromUrl(src);
      // Хеш URL → стабільне ім'я файлу (дедуплікація на рівні URL)
      const hash = crypto.createHash("sha1").update(src).digest("hex").slice(0, 10);
      const filename = `${String(j + 1).padStart(2, "0")}-${hash}.${ext}`;
      const absDest = path.join(CONFIG.imagesDir, folder, filename);
      const relForWeb = `/imported/${folder}/${filename}`;

      try {
        await downloadImage(src, absDest);
        localPaths.push(relForWeb);
        imgOk++;
      } catch (err) {
        imgFail++;
        await appendError(
          path.join(CONFIG.dataDir, CONFIG.files.errors),
          `IMAGE  ${src}  ${(err as Error).message}`,
        );
        console.warn(`  ✗ ${src} — ${(err as Error).message}`);
      }
    }

    p.local_images = localPaths;

    if ((i + 1) % 25 === 0) {
      await writeJson(dataPath("products"), data);
      console.log(`  … ${i + 1}/${data.products.length}  imgOk=${imgOk} imgFail=${imgFail}`);
    }
  }

  await writeJson(dataPath("products"), data);
  console.log(`✔ Завантажено зображень: ok=${imgOk} fail=${imgFail}`);
  console.log(`  Папка: ${CONFIG.imagesDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
