"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart-store";

export function CartLink() {
  const itemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

  return (
    <Button
      variant="ghost"
      render={<Link href="/carrinho" />}
      nativeButton={false}
      className="relative"
    >
      <ShoppingCart />
      <span className="hidden sm:inline">Carrinho</span>
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
          {itemCount}
        </span>
      )}
    </Button>
  );
}
