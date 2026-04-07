/**
 * JSON-чекпойнти на диск (атомарний запис).
 */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw err;
  }
}

// Серіалізуємо всі writeJson на один файл — щоб уникнути гонки за tmp,
// коли паралельні задачі викликають чекпойнт одночасно.
const writeQueues = new Map<string, Promise<void>>();

export async function writeJson(filePath: string, value: unknown): Promise<void> {
  const prev = writeQueues.get(filePath) ?? Promise.resolve();
  const next = prev.then(async () => {
    await ensureDir(path.dirname(filePath));
    // Унікальне tmp-ім'я: навіть якщо черга десь пропустить, не буде колізії.
    const tmp = `${filePath}.${process.pid}.${crypto.randomBytes(6).toString("hex")}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
    await fs.rename(tmp, filePath);
  });
  // Не зберігаємо помилки в черзі, щоб одна невдала писанина не блокувала наступні
  writeQueues.set(
    filePath,
    next.catch(() => {}),
  );
  return next;
}

export async function appendError(filePath: string, line: string) {
  await ensureDir(path.dirname(filePath));
  await fs.appendFile(filePath, `${new Date().toISOString()}  ${line}\n`, "utf8");
}
