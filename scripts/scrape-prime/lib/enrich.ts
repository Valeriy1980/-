/**
 * AI-двигун контенту для каталогу Prime Technics.
 *
 * Бере "сирий" товар (name + brand + category + характеристики зі скрапера) і
 * через Claude генерує фаховий контент українською: опис, короткий опис,
 * ключові переваги, нормалізовані характеристики, SEO та — головне —
 * профіль енергонезалежності (споживання, сумісність із генератором/інвертором,
 * газова альтернатива). Це стратегічна вісь для ринку України під час війни.
 *
 * Викликається зі stage 6-enrich.ts. Мережевий виклик — тому запускати на
 * машині з ANTHROPIC_API_KEY та інтернетом (як і решту скрапера).
 */
import Anthropic from "@anthropic-ai/sdk";
import type { RawProduct } from "./extract";

// ---------------------------------------------------------------------------
// Модель і параметри — керовані через .env, з розумними дефолтами.
// ---------------------------------------------------------------------------

/** За замовчуванням — найздатніша модель. Для великого каталогу можна свідомо
 *  здешевити (ENRICH_MODEL=claude-haiku-4-5 або claude-sonnet-5). */
export const ENRICH_MODEL = process.env.ENRICH_MODEL ?? "claude-opus-4-8";

/** Глибина міркування: для генерації контенту "low" — швидко й дешево.
 *  Підняти до "medium"/"high", якщо потрібен насиченіший копірайтинг. */
const ENRICH_EFFORT = (process.env.ENRICH_EFFORT ?? "low") as
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max";

const MAX_TOKENS = 3000;

// ---------------------------------------------------------------------------
// Форма результату (валідується структурованим виводом на боці API).
// ---------------------------------------------------------------------------

export interface EnergyProfile {
  /** Оцінка споживання у ватах; null, якщо визначити неможливо. */
  power_watts_estimate: number | null;
  /** Клас енергоефективності (A+++, A, тощо) або null. */
  energy_class: string | null;
  /** Чи реально запустити від побутового генератора. */
  generator_compatible: boolean;
  /** Чи дружній до інвертора / зарядної станції (низький пусковий струм). */
  inverter_friendly: boolean;
  /** Чи існує газова альтернатива цій категорії (для незалежності від мережі). */
  gas_alternative: boolean;
  /** Короткий чесний коментар українською (1 речення). */
  note: string;
}

export interface ProductSeo {
  title: string;
  meta_description: string;
  keywords: string[];
}

export interface Enrichment {
  description_short: string;
  description_full: string;
  highlights: string[];
  attributes: { name: string; value: string }[];
  energy: EnergyProfile;
  seo: ProductSeo;
}

/** JSON-схема для структурованого виводу (сумісна з обмеженнями strict-схем:
 *  усі об'єкти мають additionalProperties:false і повний required). */
const ENRICHMENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    description_short: { type: "string" },
    description_full: { type: "string" },
    highlights: { type: "array", items: { type: "string" } },
    attributes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          value: { type: "string" },
        },
        required: ["name", "value"],
      },
    },
    energy: {
      type: "object",
      additionalProperties: false,
      properties: {
        power_watts_estimate: { anyOf: [{ type: "integer" }, { type: "null" }] },
        energy_class: { anyOf: [{ type: "string" }, { type: "null" }] },
        generator_compatible: { type: "boolean" },
        inverter_friendly: { type: "boolean" },
        gas_alternative: { type: "boolean" },
        note: { type: "string" },
      },
      required: [
        "power_watts_estimate",
        "energy_class",
        "generator_compatible",
        "inverter_friendly",
        "gas_alternative",
        "note",
      ],
    },
    seo: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        meta_description: { type: "string" },
        keywords: { type: "array", items: { type: "string" } },
      },
      required: ["title", "meta_description", "keywords"],
    },
  },
  required: [
    "description_short",
    "description_full",
    "highlights",
    "attributes",
    "energy",
    "seo",
  ],
} as const;

// ---------------------------------------------------------------------------
// Промпт. Системна частина стабільна → кешується між усіма товарами (велика
// економія на каталозі в сотні SKU). Змінна частина — конкретний товар.
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `Ти — досвідчений копірайтер і товарознавець побутової техніки компанії Prime Technics (Україна). Пишеш виключно українською мовою, у довірливому, професійному та людяному тоні, без канцеляризмів і без порожньої "води".

Твоє завдання: за наданими даними про товар згенерувати якісний контент для каталогу. Працюй ЛИШЕ з фактами з вхідних даних та із загальновідомими характеристиками категорії. НЕ вигадуй конкретних цифр, яких немає у вхідних даних. Якщо параметр невідомий — не стверджуй його; оцінки позначай приблизними ("≈").

Правила для полів:
- description_short: один рядок, до ~140 символів — суть і головна вигода.
- description_full: 2–4 абзаци (~500–900 символів) — для кого товар, ключові переваги, сценарії використання. Без списків.
- highlights: 3–5 стислих буліт-переваг (по кілька слів кожен).
- attributes: нормалізовані пари "назва: значення" з вхідних характеристик — почисти сміття, уніфікуй одиниці, прибери дублікати. Якщо характеристик мало — виведи те, що є.
- seo: title (до 60 символів), meta_description (до 155 символів), 5–8 keywords українською.

ОСОБЛИВО ВАЖЛИВО — energy (енергонезалежність, критична тема для України під час війни та блекаутів):
- power_watts_estimate: оцінка споживання у ватах на основі категорії та даних (null, якщо ніяк не оцінити).
- energy_class: клас енергоефективності, якщо відомий, інакше null.
- generator_compatible: true лише якщо техніку реально живити від типового побутового генератора (враховуй пускові струми компресорів/ТЕНів).
- inverter_friendly: true, якщо пристрій дружній до інвертора чи зарядної станції (невисокий пусковий струм, стабільне живлення).
- gas_alternative: true, якщо для цієї категорії існує газова альтернатива (напр. газові плити/духовки/колонки), що знижує залежність від електромережі.
- note: одне чесне речення-порада щодо енергонезалежності саме цього товару.

Відповідай СУВОРО у форматі заданої JSON-схеми, без пояснень поза нею.`;

function buildUserContent(p: RawProduct): string {
  const attrs =
    p.attributes && p.attributes.length
      ? p.attributes.map((a) => `- ${a.name}: ${a.value}`).join("\n")
      : "(характеристики відсутні)";

  const lines = [
    `Назва: ${p.name}`,
    `Бренд: ${p.brand ?? "Prime Technics"}`,
    `Категорія: ${p.category_path?.join(" / ") || "(невідомо)"}`,
    p.description_short ? `Наявний короткий опис: ${p.description_short}` : null,
    p.description_full ? `Наявний повний опис: ${p.description_full}` : null,
    "",
    "Характеристики:",
    attrs,
  ].filter(Boolean);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Клієнт і виклик.
// ---------------------------------------------------------------------------

export function createClient(): Anthropic {
  // Ключ береться з ANTHROPIC_API_KEY (або активного профілю `ant`).
  // maxRetries: SDK сам робить експоненційний backoff на 429/5xx/мережі.
  return new Anthropic({ maxRetries: 4 });
}

/** Генерує контент для одного товару. Кидає помилку — виклик нагорі логує й іде далі. */
export async function enrichProduct(
  client: Anthropic,
  product: RawProduct,
): Promise<Enrichment> {
  const response = await client.messages.create({
    model: ENRICH_MODEL,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        // Стабільний префікс кешується → дешевші наступні товари каталогу.
        cache_control: { type: "ephemeral" },
      },
    ],
    output_config: {
      effort: ENRICH_EFFORT,
      format: { type: "json_schema", schema: ENRICHMENT_SCHEMA },
    },
    messages: [{ role: "user", content: buildUserContent(product) }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("модель відмовила у відповіді (refusal)");
  }

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  if (!text) throw new Error("порожня відповідь моделі");

  let parsed: Enrichment;
  try {
    parsed = JSON.parse(text) as Enrichment;
  } catch {
    throw new Error(`не вдалося розпарсити JSON: ${text.slice(0, 200)}`);
  }
  return parsed;
}
