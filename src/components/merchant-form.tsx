"use client";

import { useActionState } from "react";
import { saveMerchant, type ActionResult } from "@/lib/actions/merchant";
import type { Merchant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionResult = {};

export function MerchantForm({ merchant }: { merchant: Merchant | null }) {
  const [state, formAction, pending] = useActionState(saveMerchant, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome da loja</Label>
        <Input id="name" name="name" defaultValue={merchant?.name} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="city">Cidade</Label>
        <Input id="city" name="city" defaultValue={merchant?.city} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="address">Endereço</Label>
        <Input id="address" name="address" defaultValue={merchant?.address ?? ""} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" defaultValue={merchant?.phone ?? ""} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="openingHours">Horário de funcionamento</Label>
        <Textarea
          id="openingHours"
          name="openingHours"
          defaultValue={merchant?.opening_hours ?? ""}
          placeholder="Ex: Seg a Sáb, 18h às 23h"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="deliveryFee">Taxa de entrega (R$)</Label>
        <Input
          id="deliveryFee"
          name="deliveryFee"
          type="number"
          step="0.01"
          min="0"
          defaultValue={merchant?.delivery_fee ?? 0}
          required
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
