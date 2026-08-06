"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function CarrinhoPage() {
  const { merchantName, items, setQuantity, removeItem } = useCartStore();

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="size-7 text-muted-foreground" />
        </div>
        <p className="mb-4 text-muted-foreground">Seu carrinho está vazio.</p>
        <Button render={<Link href="/" />} nativeButton={false}>
          Ver lojas
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">Seu carrinho</h1>
      <p className="mb-6 text-muted-foreground">{merchantName}</p>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center justify-between gap-4 rounded-xl border bg-card p-3 shadow-sm"
          >
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">R$ {item.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setQuantity(item.productId, item.quantity - 1)}
              >
                <Minus />
              </Button>
              <span className="w-6 text-center tabular-nums">{item.quantity}</span>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setQuantity(item.productId, item.quantity + 1)}
              >
                <Plus />
              </Button>
            </div>
            <p className="w-20 text-right font-medium tabular-nums">
              R$ {(item.price * item.quantity).toFixed(2)}
            </p>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => removeItem(item.productId)}
              aria-label="Remover item"
            >
              <Trash2 className="text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <Separator className="my-6" />

      <div className="flex items-center justify-between text-lg font-medium">
        <span>Subtotal</span>
        <span className="tabular-nums">R$ {subtotal.toFixed(2)}</span>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        A taxa de entrega é calculada na próxima etapa.
      </p>

      <Button render={<Link href="/checkout" />} nativeButton={false} className="w-full" size="lg">
        Continuar para o checkout
      </Button>
    </div>
  );
}
