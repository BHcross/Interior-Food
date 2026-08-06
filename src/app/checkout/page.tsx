"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Banknote, MapPin, QrCode, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { createClient } from "@/lib/supabase/client";
import { createOrder } from "@/lib/actions/orders";
import type { PaymentMethod } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function CheckoutPage() {
  const { merchantId, merchantName, items } = useCartStore();
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("dinheiro");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!merchantId) return;
    const supabase = createClient();
    supabase
      .from("merchants")
      .select("delivery_fee")
      .eq("id", merchantId)
      .single()
      .then(({ data }) => setDeliveryFee(data?.delivery_fee ?? 0));
  }, [merchantId]);

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

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal + (deliveryFee ?? 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createOrder({
        merchantId: merchantId!,
        items,
        deliveryAddress: address,
        paymentMethod,
        notes,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold">Finalizar pedido</h1>
      <p className="mb-6 text-muted-foreground">{merchantName}</p>

      <div className="grid gap-6 sm:grid-cols-[1.2fr_1fr]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="address" className="flex items-center gap-1.5">
              <MapPin className="size-4 text-primary" />
              Endereço de entrega
            </Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, bairro, ponto de referência"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Forma de pagamento (na entrega)</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("dinheiro")}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-sm font-medium transition-colors ${
                  paymentMethod === "dinheiro"
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                <Banknote className="size-5" />
                Dinheiro
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("pix")}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-sm font-medium transition-colors ${
                  paymentMethod === "pix"
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                <QrCode className="size-5" />
                Pix
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: sem cebola, troco para R$ 50"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">
              {error}{" "}
              {error.includes("entrar") && (
                <Link href="/entrar" className="underline">
                  Entrar
                </Link>
              )}
            </p>
          )}

          <Button type="submit" disabled={pending} className="w-full" size="lg">
            {pending ? "Enviando pedido..." : "Confirmar pedido"}
          </Button>
        </form>

        <Card className="h-fit shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between">
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span className="tabular-nums">R$ {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="tabular-nums">R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Entrega</span>
              <span className="tabular-nums">
                {deliveryFee === null ? "..." : `R$ ${deliveryFee.toFixed(2)}`}
              </span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums text-primary">R$ {total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
