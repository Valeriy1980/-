# Імпорт каталогу з prime-technics.com

Краулер для свого ж сайту: збирає товари, характеристики та фото
з `https://www.prime-technics.com` і кладе їх у наш Showroom Portal.

> **Запускати ТІЛЬКИ на вашій машині (Mac)** — sandbox Claude Code не має
> доступу до зовнішнього інтернету.

## Що робить

| Етап | Скрипт                | Що відбувається                                            | Куди пише                          |
| ---- | --------------------- | ---------------------------------------------------------- | ---------------------------------- |
| 1    | `npm run scrape:discover` | Читає `robots.txt`/`sitemap.xml`, збирає URL товарів       | `data/prime/urls.json`             |
| 2    | `npm run scrape:fetch`    | Качає HTML кожного товару, парсить (JSON-LD + fallback)    | `data/prime/products.json` + `raw/`|
| 3    | `npm run scrape:images`   | Качає всі фото з дедуплікацією                             | `public/imported/<sku>/*.{jpg,…}`  |
| 4    | `npm run scrape:mock`     | Перетворює JSON у `src/lib/mock/products.ts`               | (перезаписує файл!)                |

Або одним пострілом: `npm run scrape:all`

## Запуск

```bash
# на вашому Mac
cd showroom-portal
git pull
npm install                # підтягне tsx, cheerio, p-limit
npm run scrape:all
npm run dev
open http://localhost:3000/catalog
```

Очікуваний час для 500 товарів × ~6 фото:
- Discover: 5-10 секунд
- Fetch+parse: ~10-15 хвилин
- Images: ~20-30 хвилин
- Mock-генерація: 1 секунда

## Стійкість і resume

Усі етапи **resumable**:
- HTML товарів кешуються в `data/prime/raw/<slug>.html` — повторний запуск
  не качає їх вдруге.
- `products.json` пишеться чекпойнтами кожні 25 товарів.
- Зображення пропускаються, якщо вже є на диску.
- Помилки логуються у `data/prime/errors.log`.

Якщо crawl перервався — просто запустіть той самий етап ще раз, він
продовжить з того місця.

## Налаштування

Усі параметри — у `lib/config.ts`:

- `concurrency: 3` — паралельні запити
- `throttleMs: 500` — мінімум між запитами (ввічливість до сервера)
- `retries: 3` — спроби при помилці
- `timeoutMs: 30000` — таймаут одного запиту

## Якщо щось не парситься

CSS-fallback селектори знаходяться в `lib/extract.ts`, об'єкт `FALLBACK`.
Якщо після першого запуску побачите попередження виду:

```
⚠ https://...  name="", images=0
```

відкрийте відповідний `data/prime/raw/<slug>.html`, гляньте на справжню
структуру (або скиньте мені — я підкоригую селектори).

JSON-LD парсер працює "з коробки" і повинен покрити більшість сучасних
e-commerce сайтів — він читає `<script type="application/ld+json">` з
`@type: "Product"` і витягає звідти всі основні поля.

## Видалення артефактів

```bash
rm -rf data/prime
rm -rf public/imported
```
