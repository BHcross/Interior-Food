export type Role = "customer" | "merchant" | "courier";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "dinheiro" | "pix";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Novo pedido",
  confirmed: "Confirmado",
  preparing: "Em preparo",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
];

export interface Profile {
  id: string;
  role: Role;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

export interface Merchant {
  id: string;
  profile_id: string;
  name: string;
  slug: string;
  city: string;
  address: string | null;
  phone: string | null;
  opening_hours: string | null;
  delivery_fee: number;
  status: "pending" | "approved";
  latitude: number | null;
  longitude: number | null;
  logo_url: string | null;
  delivery_mode: "platform" | "own";
  created_at: string;
}

export interface Category {
  id: string;
  merchant_id: string;
  name: string;
  sort_order: number;
}

export interface Product {
  id: string;
  merchant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  merchant_id: string;
  courier_id: string | null;
  status: OrderStatus;
  delivery_address: string;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  payment_method: PaymentMethod;
  notes: string | null;
  delivery_fee: number;
  total: number;
  created_at: string;
  updated_at: string;
}

export interface CourierLocation {
  courier_id: string;
  latitude: number;
  longitude: number;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  notes: string | null;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export type ChatChannel = "customer_merchant" | "customer_courier" | "merchant_courier";

export interface OrderMessage {
  id: string;
  order_id: string;
  channel: ChatChannel;
  sender_id: string;
  body: string;
  created_at: string;
}
