"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart-store";

export function AddToCartButton({
  merchantId,
  merchantName,
  productId,
  name,
  price,
}: {
  merchantId: string;
  merchantName: string;
  productId: string;
  name: string;
  price: number;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const currentMerchantId = useCartStore((s) => s.merchantId);

  function handleAdd() {
    if (currentMerchantId && currentMerchantId !== merchantId) {
      toast.warning("Seu carrinho foi trocado para esta loja.");
    }
    addItem(merchantId, merchantName, { productId, name, price, quantity: 1 });
    toast.success(`${name} adicionado ao carrinho`);
  }

  return (
    <Button size="sm" onClick={handleAdd}>
      Adicionar
    </Button>
  );
}
