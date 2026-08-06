"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CartItem, PaymentMethod } from "@/lib/types";

export interface CreateOrderInput {
  merchantId: string;
  items: CartItem[];
  deliveryAddress: string;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface CreateOrderResult {
  error?: string;
  orderId?: string;
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "É preciso entrar na sua conta para finalizar o pedido." };
  }

  if (!input.items.length) {
    return { error: "Seu carrinho está vazio." };
  }

  if (!input.deliveryAddress.trim()) {
    return { error: "Informe o endereço de entrega." };
  }

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, delivery_fee, status")
    .eq("id", input.merchantId)
    .single();

  if (!merchant || merchant.status !== "approved") {
    return { error: "Loja não encontrada." };
  }

  // Busca os preços reais no banco — nunca confia no preço vindo do cliente.
  const productIds = input.items.map((i) => i.productId);
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, available")
    .in("id", productIds);

  if (!products || products.length !== productIds.length) {
    return { error: "Algum produto do carrinho não está mais disponível." };
  }

  const unavailable = products.find((p) => !p.available);
  if (unavailable) {
    return { error: `"${unavailable.name}" não está mais disponível.` };
  }

  const itemsWithRealPrice = input.items.map((cartItem) => {
    const product = products.find((p) => p.id === cartItem.productId)!;
    return {
      product_id: product.id,
      product_name: product.name,
      unit_price: product.price,
      quantity: cartItem.quantity,
      notes: cartItem.notes ?? null,
    };
  });

  const subtotal = itemsWithRealPrice.reduce(
    (sum, i) => sum + i.unit_price * i.quantity,
    0,
  );
  const total = subtotal + merchant.delivery_fee;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: user.id,
      merchant_id: merchant.id,
      delivery_address: input.deliveryAddress,
      delivery_latitude: input.deliveryLatitude ?? null,
      delivery_longitude: input.deliveryLongitude ?? null,
      payment_method: input.paymentMethod,
      notes: input.notes || null,
      delivery_fee: merchant.delivery_fee,
      total,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { error: "Não foi possível criar o pedido. Tente novamente." };
  }

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(itemsWithRealPrice.map((item) => ({ ...item, order_id: order.id })));

  if (itemsError) {
    return { error: "Não foi possível salvar os itens do pedido." };
  }

  redirect(`/pedido/${order.id}`);
}

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  return { error: error?.message };
}
