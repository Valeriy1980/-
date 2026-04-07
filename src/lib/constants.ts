export const SITE_NAME = "Showroom Portal";

export const ORDER_STATUS = {
  new: "Нове",
  confirmed: "Підтверджено",
  shipped: "Відвантажено",
  delivered: "Доставлено",
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS;

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  new: "bg-blue-100 text-blue-700",
  confirmed: "bg-amber-100 text-amber-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-emerald-100 text-emerald-700",
};

export const MAX_COMPARE_ITEMS = 4;

export const NAV_MAIN = [
  { href: "/", label: "Головна" },
  { href: "/catalog", label: "Каталог" },
  { href: "/compare", label: "Порівняння" },
  { href: "/cart", label: "Кошик" },
  { href: "/dashboard", label: "Кабінет" },
];
