/**
 * HTTP-клієнт з retry, throttle і ввічливим User-Agent.
 */
import { setTimeout as sleep } from "node:timers/promises";
import pLimit from "p-limit";
import { CONFIG } from "./config";

const limit = pLimit(CONFIG.concurrency);
let lastRequestAt = 0;

async function throttle() {
  const now = Date.now();
  const wait = Math.max(0, lastRequestAt + CONFIG.throttleMs - now);
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
}

export interface FetchOptions {
  asBuffer?: boolean;
}

export async function fetchUrl(
  url: string,
  opts: FetchOptions = {},
): Promise<string | Buffer> {
  return limit(async () => {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= CONFIG.retries; attempt++) {
      try {
        await throttle();
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), CONFIG.timeoutMs);
        const res = await fetch(url, {
          headers: {
            "User-Agent": CONFIG.userAgent,
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "uk-UA,uk;q=0.9,en;q=0.8",
          },
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
        }
        return opts.asBuffer
          ? Buffer.from(await res.arrayBuffer())
          : await res.text();
      } catch (err) {
        lastErr = err;
        if (attempt < CONFIG.retries) {
          const backoff = 2 ** attempt * 1000;
          console.warn(
            `  retry ${attempt}/${CONFIG.retries} after ${backoff}ms — ${(err as Error).message}`,
          );
          await sleep(backoff);
        }
      }
    }
    throw lastErr;
  });
}
