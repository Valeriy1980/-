// Domain types matching the Supabase schema described in the project spec.
// Will be replaced/augmented by `supabase gen types` once the DB exists.

export type ProductStatus = "active" | "inactive" | "archived";

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  image_url: string | null;
  sort_order: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand_id: string;
  category_id: string;
  description_short: string | null;
  description_full: string | null;
  retail_price: number;
  wholesale_price: number | null;
  stock_quantity: number;
  status: ProductStatus;
  is_new: boolean;
  is_promo: boolean;
  promo_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  is_main: boolean;
}

export interface ProductAttribute {
  id: string;
  product_id: string;
  attribute_name: string;
  attribute_value: string;
  sort_order: number;
}

export interface ProductDocument {
  id: string;
  product_id: string;
  title: string;
  file_url: string;
  type: "manual" | "certificate" | "other";
}

export interface Partner {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string | null;
  city: string | null;
  discount_percent: number;
  price_group: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  partner_id: string;
  status: "new" | "confirmed" | "shipped" | "delivered";
  total_amount: number;
  delivery_method: "pickup" | "delivery";
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_order: number;
}

export interface Favorite {
  id: string;
  partner_id: string;
  product_id: string;
  created_at: string;
}

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  sort_order: number;
}

/** Cart item kept locally before sync. */
export interface CartLine {
  product_id: string;
  quantity: number;
}
