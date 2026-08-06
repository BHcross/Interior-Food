export type Role = "customer" | "merchant";

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
  status: OrderStatus;
  delivery_address: string;
  payment_method: PaymentMethod;
  notes: string | null;
  delivery_fee: number;
  total: number;
  created_at: string;
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
