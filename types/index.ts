// ── Users ──────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  role: "customer" | "staff" | "admin" | "super_admin";
  is_active: boolean;
  is_email_verified: boolean;
  profile_image?: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
  is_new_user?: boolean;
}

// ── Products ───────────────────────────────────────────────────────────────
export interface ProductImage {
  id: number;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductVariant {
  id: number;
  name: string;
  value: string;
  sku?: string;
  price_modifier: number;
  stock: number;
  is_active: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  brand?: string;
  sku?: string;
  price: number;
  compare_price?: number;
  category_id?: number;
  stock: number;
  status: "active" | "inactive" | "out_of_stock" | "draft";
  is_featured: boolean;
  is_best_seller: boolean;
  avg_rating: number;
  review_count: number;
  sold_count: number;
  tags?: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  created_at: string;
}

export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ── Categories ─────────────────────────────────────────────────────────────
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: number;
  is_active: boolean;
  children?: Category[];
}

// ── Cart ────────────────────────────────────────────────────────────────────
export interface CartItem {
  id: number;
  product_id: number;
  variant_id?: number;
  quantity: number;
  save_for_later: boolean;
  product: Product;
  variant?: ProductVariant;
}

export interface Cart {
  id: number;
  items: CartItem[];
  coupon_code?: string;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  tax_amount: number;
  total_amount: number;
}

// ── Orders ─────────────────────────────────────────────────────────────────
export type OrderStatus =
  | "pending" | "paid" | "processing" | "shipped"
  | "out_for_delivery" | "delivered" | "cancelled" | "returned" | "refunded";

export interface OrderItem {
  id: number;
  product_id?: number;
  variant_id?: number;
  product_name: string;
  variant_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  estimated_delivery?: string;
  delivered_at?: string;
  items: OrderItem[];
  created_at: string;
}

export interface PaginatedOrders {
  items: Order[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ── Address ────────────────────────────────────────────────────────────────
export interface Address {
  id: number;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
  address_type: "home" | "work" | "other";
}

// ── Review ─────────────────────────────────────────────────────────────────
export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  title?: string;
  body?: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
}

// ── Shipment ───────────────────────────────────────────────────────────────
export interface Shipment {
  id: number;
  order_id: number;
  tracking_number?: string;
  carrier?: string;
  carrier_tracking_url?: string;
  status: string;
  shipped_at?: string;
  estimated_delivery?: string;
  delivered_at?: string;
}

// ── Return ─────────────────────────────────────────────────────────────────
export interface ReturnRequest {
  id: number;
  order_id: number;
  user_id: number;
  reason: string;
  status: string;
  admin_notes?: string;
  created_at: string;
}

// ── Coupon ─────────────────────────────────────────────────────────────────
export interface Coupon {
  id: number;
  code: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_discount_amount?: number;
  min_order_value: number;
  is_active: boolean;
  expires_at?: string;
  usage_limit?: number;
  used_count: number;
  created_at: string;
}

// ── Support ────────────────────────────────────────────────────────────────
export interface SupportTicket {
  id: number;
  user_id: number;
  order_id?: number;
  subject: string;
  message: string;
  priority: string;
  status: string;
  admin_reply?: string;
  resolved_at?: string;
  created_at: string;
}

// ── Analytics ──────────────────────────────────────────────────────────────
export interface DashboardSummary {
  total_revenue: number;
  monthly_revenue: number;
  total_orders: number;
  monthly_orders: number;
  avg_order_value: number;
  total_users: number;
  total_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
  revenue_chart: { month: string; revenue: number }[];
  top_products: { id: number; name: string; sold_count: number; price: number }[];
}
