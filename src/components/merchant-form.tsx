"use client";

import { useActionState, useState } from "react";
import { Bike, Building2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { saveMerchant, type ActionResult } from "@/lib/actions/merchant";
import type { Merchant } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AddressSearchInput } from "@/components/address-search-input";
import { LocationPickerMap } from "@/components/location-picker-map";

const initialState: ActionResult = {};

export function MerchantForm({ merchant }: { merchant: Merchant | null }) {
  const [state, formAction, pending] = useActionState(saveMerchant, initialState);
  const [latitude, setLatitude] = useState<number | null>(merchant?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(merchant?.longitude ?? null);
  const [logoUrl, setLogoUrl] = useState<string | null>(merchant?.logo_url ?? null);
  const [deliveryMode, setDeliveryMode] = useState<"platform" | "own">(
    merchant?.delivery_mode ?? "platform",
  );
  const [uploadingLogo, setUploadingLogo] = useState(false);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Sua sessão expirou. Entre novamente para enviar a imagem.");
      setUploadingLogo(false);
      return;
    }
    const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file);

    if (uploadError) {
      toast.error("Não foi possível enviar a imagem.");
      setUploadingLogo(false);
      return;
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setLogoUrl(data.publicUrl);
    setUploadingLogo(false);
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Logo / imagem da loja</Label>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Logo da loja"
              className="size-20 shrink-0 rounded-xl border border-border/70 object-cover shadow-sm"
            />
          ) : (
            <div className="flex size-20 shrink-0 items-center justify-center rounded-xl border border-dashed bg-muted">
              <ImagePlus className="size-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <Input type="file" accept="image/*" onChange={handleLogoChange} />
            {uploadingLogo && (
              <p className="text-sm text-muted-foreground">Enviando imagem...</p>
            )}
            <p className="text-sm text-muted-foreground">
              Aparece na listagem de lojas e no topo da página da sua loja.
            </p>
          </div>
        </div>
        <input type="hidden" name="logoUrl" value={logoUrl ?? ""} />
      </div>

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

      <div className="flex flex-col gap-2">
        <Label>Como sua loja faz as entregas?</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setDeliveryMode("platform")}
            className={`flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition-all ${
              deliveryMode === "platform"
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border/70 hover:bg-muted"
            }`}
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Bike className="size-4" />
              Entregadores do app
            </span>
            <span className="text-sm text-muted-foreground">
              Seus pedidos &quot;em preparo&quot; ficam disponíveis para qualquer
              entregador cadastrado no Interior Food aceitar.
            </span>
          </button>
          <button
            type="button"
            onClick={() => setDeliveryMode("own")}
            className={`flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition-all ${
              deliveryMode === "own"
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border/70 hover:bg-muted"
            }`}
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Building2 className="size-4" />
              Entregador próprio
            </span>
            <span className="text-sm text-muted-foreground">
              Sua entrega não aparece pros entregadores do app. Você mesmo controla o
              status &quot;Saiu para entrega&quot; e &quot;Entregue&quot;.
            </span>
          </button>
        </div>
        <input type="hidden" name="deliveryMode" value={deliveryMode} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Localização da loja no mapa</Label>
        <p className="text-sm text-muted-foreground">
          Busque o endereço ou clique/arraste o pino no mapa para ajustar. Isso é o que
          aparece pro cliente e pro entregador.
        </p>
        <AddressSearchInput
          onSelect={(result) => {
            setLatitude(result.latitude);
            setLongitude(result.longitude);
          }}
        />
        <LocationPickerMap
          latitude={latitude}
          longitude={longitude}
          onChange={(lat, lng) => {
            setLatitude(lat);
            setLongitude(lng);
          }}
        />
        <input type="hidden" name="latitude" value={latitude ?? ""} />
        <input type="hidden" name="longitude" value={longitude ?? ""} />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending || uploadingLogo} className="w-fit">
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
