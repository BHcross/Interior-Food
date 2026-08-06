"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/cart-store";

// Depois que um pedido é criado com sucesso, limpa o carrinho da loja
// correspondente (evita apagar um carrinho de outra loja em andamento).
export function ClearCartIfMatches({ merchantId }: { merchantId: string }) {
  const cartMerchantId = useCartStore((s) => s.merchantId);
  const clear = useCartStore((s) => s.clear);

  useEffect(() => {
    if (cartMerchantId === merchantId) {
      clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantId]);

  return null;
}
