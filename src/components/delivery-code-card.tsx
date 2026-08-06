"use client";

import { useState } from "react";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { confirmDeliveryByCustomer } from "@/lib/actions/orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function DeliveryCodeCard({ orderId, code }: { orderId: string; code: string }) {
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function handleConfirm() {
    setConfirming(true);
    const result = await confirmDeliveryByCustomer(orderId);
    setConfirming(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setConfirmed(true);
    toast.success("Entrega confirmada, obrigado!");
  }

  if (confirmed) return null;

  return (
    <Card className="mt-6 border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-base">
          <KeyRound className="size-4 text-primary" />
          Código de confirmação de entrega
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Informe este código ao entregador quando ele chegar. Isso confirma que o
          pedido foi entregue de verdade.
        </p>
        <p className="text-center text-3xl font-bold tracking-[0.3em] text-primary">
          {code}
        </p>
        <Button onClick={handleConfirm} disabled={confirming} variant="outline">
          {confirming ? "Confirmando..." : "Já recebi meu pedido"}
        </Button>
      </CardContent>
    </Card>
  );
}
