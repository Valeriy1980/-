# B2C Showroom Portal

Веб-портал для партнерів — цифровий шоурум побутової техніки. Партнер відкриває
портал на планшеті/ноутбуці та показує покупцю каталог з фото, описом,
характеристиками, цінами і реальними залишками. Замовлення оформлюється на місці.

## Стек

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** (з власною дизайн-системою у `tailwind.config.ts`)
- **Supabase** (`@supabase/ssr`) — клієнти у `src/lib/supabase/`
- **PWA** — `public/manifest.webmanifest`
- **lucide-react** — іконки

## Структура

```
src/
├── app/                 # Маршрутизація App Router (всі сторінки порталу)
│   ├── catalog/         # Каталог + категорії
│   ├── product/[slug]/  # Картка товару
│   ├── compare/         # Порівняння товарів
│   ├── cart/            # Кошик
│   ├── checkout/        # Оформлення замовлення
│   ├── showroom/        # Showroom-режим (без авторизації)
│   ├── login/           # Авторизація партнера
│   ├── dashboard/       # Кабінет партнера
│   └── admin/           # Адмін-панель
├── components/
│   ├── layout/          # Header, Footer, MobileNav
│   └── ui/              # Button, Card, Badge (shadcn-style)
├── lib/
│   ├── supabase/        # Browser + server клієнти
│   ├── utils.ts         # cn, formatPrice, formatDate, slugify
│   └── constants.ts
├── types/               # TypeScript типи доменних сутностей
└── styles/globals.css
```

## Запуск

```bash
cp .env.example .env.local      # додати ключі Supabase
npm install
npm run dev
```

Відкрити <http://localhost:3000>.

## Стан розробки

- [x] **Етап 1 — Каркас:** Next.js + Tailwind, всі маршрути, layout, Supabase
      клієнти, PWA-маніфест, базові UI-примітиви
- [ ] Етап 2 — Каталог
- [ ] Етап 3 — Товар
- [ ] Етап 4 — Замовлення
- [ ] Етап 5 — Авторизація та кабінет
- [ ] Етап 6 — Адмін-панель
- [ ] Етап 7 — Аналітика та полірування

## Дизайн-токени

- Brand: `#2563EB` (синій)
- Accent: `#F97316` (помаранчевий, CTA)
- Surface: `#F8FAFC`
- Ink: `#1E293B`
- Шрифт: Inter (Google Fonts)
- Радіус карток: 8px

## Конвенції

- Всі тексти інтерфейсу — українською
- Ціни: `12 999 ₴` (NBSP-роздільник тисяч) — `formatPrice()`
- Дати: `06.04.2026` — `formatDate()`
- Адаптив: 1200+ desktop, 768–1199 планшет, <768 мобільний
