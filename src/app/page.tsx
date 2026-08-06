import Link from "next/link";
import { MapPin, Store as StoreIcon, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Merchant } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function Home() {
  const supabase = await createClient();
  const { data: merchants } = await supabase
    .from("merchants")
    .select("*")
    .eq("status", "approved")
    .order("name")
    .returns<Merchant[]>();

  return (
    <div>
      <div className="border-b bg-gradient-to-b from-accent/60 to-background">
        <div className="mx-auto w-full max-w-5xl px-4 py-10">
          <h1 className="mb-1 text-3xl font-semibold tracking-tight">
            Lojas perto de você
          </h1>
          <p className="text-muted-foreground">
            Escolha uma loja da sua cidade e monte seu pedido.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {!merchants || merchants.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
              <StoreIcon className="size-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Nenhuma loja disponível por aqui ainda. Volte em breve!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {merchants.map((merchant) => (
              <Link key={merchant.id} href={`/loja/${merchant.slug}`}>
                <Card className="h-full gap-3 overflow-hidden pt-0 transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex h-24 items-center justify-center bg-gradient-to-br from-primary/15 to-accent">
                    <StoreIcon className="size-8 text-primary" />
                  </div>
                  <CardContent className="flex flex-col gap-2">
                    <h2 className="font-semibold">{merchant.name}</h2>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {merchant.city}
                    </p>
                    <Badge variant="secondary" className="w-fit gap-1">
                      <Truck className="size-3" />
                      Entrega R$ {merchant.delivery_fee.toFixed(2)}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
