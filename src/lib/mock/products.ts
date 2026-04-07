import type { Brand, Category, Product, ProductImage } from "@/types";

export const MOCK_CATEGORIES: Category[] = [
  { id: "c1", name: "Пральні машини", slug: "washing-machines", parent_id: null, image_url: null, sort_order: 1 },
  { id: "c2", name: "Холодильники", slug: "refrigerators", parent_id: null, image_url: null, sort_order: 2 },
  { id: "c3", name: "Телевізори", slug: "tvs", parent_id: null, image_url: null, sort_order: 3 },
  { id: "c4", name: "Кухонні плити", slug: "stoves", parent_id: null, image_url: null, sort_order: 4 },
  { id: "c5", name: "Мікрохвильові печі", slug: "microwaves", parent_id: null, image_url: null, sort_order: 5 },
  { id: "c6", name: "Посудомийні машини", slug: "dishwashers", parent_id: null, image_url: null, sort_order: 6 },
];

export const MOCK_BRANDS: Brand[] = [
  { id: "b1", name: "BEKO", slug: "beko", logo_url: null },
  { id: "b2", name: "INDESIT", slug: "indesit", logo_url: null },
  { id: "b3", name: "Prime Technics", slug: "prime-technics", logo_url: null },
  { id: "b4", name: "Samsung", slug: "samsung", logo_url: null },
  { id: "b5", name: "LG", slug: "lg", logo_url: null },
  { id: "b6", name: "Bosch", slug: "bosch", logo_url: null },
];

interface MockProduct extends Product {
  brand: Brand;
  category: Category;
  main_image: ProductImage;
  images: string[];
}

const make = (
  i: number,
  name: string,
  slug: string,
  sku: string,
  brandIdx: number,
  categoryIdx: number,
  retail: number,
  wholesale: number,
  stock: number,
  opts: Partial<Pick<Product, "is_new" | "is_promo" | "promo_price">> = {},
): MockProduct => {
  const brand = MOCK_BRANDS[brandIdx];
  const category = MOCK_CATEGORIES[categoryIdx];
  return {
    id: `p${i}`,
    name,
    slug,
    sku,
    brand_id: brand.id,
    category_id: category.id,
    description_short:
      "Сучасна модель з оптимальним поєднанням ціни та функціональності.",
    description_full: null,
    retail_price: retail,
    wholesale_price: wholesale,
    stock_quantity: stock,
    status: "active",
    is_new: opts.is_new ?? false,
    is_promo: opts.is_promo ?? false,
    promo_price: opts.promo_price ?? null,
    created_at: new Date(2026, 0, i + 1).toISOString(),
    updated_at: new Date(2026, 0, i + 1).toISOString(),
    brand,
    category,
    main_image: {
      id: `img${i}`,
      product_id: `p${i}`,
      image_url: "",
      sort_order: 0,
      is_main: true,
    },
    images: [],
  };
};

export const MOCK_PRODUCTS: MockProduct[] = [
  make(1, "Пральна машина BEKO WUE 6512 XWW", "beko-wue-6512", "WM-001", 0, 0, 12999, 11200, 8, { is_new: true }),
  make(2, "Пральна машина INDESIT BWSA 61051", "indesit-bwsa-61051", "WM-002", 1, 0, 10499, 9100, 12),
  make(3, "Пральна машина Bosch WAN24062", "bosch-wan24062", "WM-003", 5, 0, 17499, 15300, 4, { is_promo: true, promo_price: 15999 }),
  make(4, "Холодильник Samsung RB30N4020B1", "samsung-rb30n4020b1", "RF-001", 3, 1, 18999, 16500, 6),
  make(5, "Холодильник LG GA-B459MMQM", "lg-ga-b459mmqm", "RF-002", 4, 1, 22499, 19800, 3, { is_new: true }),
  make(6, "Холодильник BEKO RCNA-365E30W", "beko-rcna-365e30w", "RF-003", 0, 1, 16299, 14000, 9),
  make(7, 'Телевізор Samsung 50" UE50AU7100', "samsung-ue50au7100", "TV-001", 3, 2, 19999, 17500, 5, { is_promo: true, promo_price: 17499 }),
  make(8, 'Телевізор LG 43" 43UP75006LF', "lg-43up75006lf", "TV-002", 4, 2, 14999, 12800, 7),
  make(9, 'Телевізор Samsung 55" UE55BU8500', "samsung-ue55bu8500", "TV-003", 3, 2, 24499, 21000, 0, { is_new: true }),
  make(10, "Кухонна плита BEKO FFSE 67300 GW", "beko-ffse-67300gw", "ST-001", 0, 3, 13499, 11700, 4),
  make(11, "Кухонна плита Prime Technics PSE 64055", "prime-pse-64055", "ST-002", 2, 3, 8499, 7100, 11),
  make(12, "Мікрохвильова піч Samsung MS23F302TAS", "samsung-ms23f302tas", "MW-001", 3, 4, 4299, 3650, 15, { is_promo: true, promo_price: 3799 }),
  make(13, "Мікрохвильова піч LG MS-2042DB", "lg-ms-2042db", "MW-002", 4, 4, 3499, 2900, 18),
  make(14, "Посудомийна машина Bosch SMS25AW01K", "bosch-sms25aw01k", "DW-001", 5, 5, 16999, 14800, 6, { is_new: true }),
  make(15, "Посудомийна машина BEKO DFN05W13W", "beko-dfn05w13w", "DW-002", 0, 5, 12499, 10800, 8),
];

export type { MockProduct };
