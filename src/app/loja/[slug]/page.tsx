import { notFound } from "next/navigation";
import { Clock, MapPin, Store as StoreIcon, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Category, Merchant, Product } from "@/lib/types";
import { StoreMap } from "@/components/store-map";
import { StoreMenu } from "@/components/store-menu";
import { Badge } from "@/components/ui/badge";

export default async function LojaPage(props: PageProps<"/loja/[slug]">) {
  const { slug } = await props.params;
  const supabase = await createClient();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("*")
    .eq("slug", slug)
    .eq("status", "approved")
    .single<Merchant>();

  if (!merchant) notFound();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("merchant_id", merchant.id)
      .order("sort_order")
      .returns<Category[]>(),
    supabase
      .from("products")
      .select("*")
      .eq("merchant_id", merchant.id)
      .eq("available", true)
      .returns<Product[]>(),
  ]);

  return (
    <div>
      <div className="border-b bg-gradient-to-br from-primary/10 to-accent/40">
        <div className="mx-auto w-full max-w-3xl px-4 py-8">
          <div className="flex items-center gap-4">
            {merchant.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={merchant.logo_url}
                alt={merchant.name}
                className="size-14 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <StoreIcon className="size-6 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-semibold">{merchant.name}</h1>
              <p className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="size-3.5" />
                {merchant.city}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <Truck className="size-3" />
              Entrega: R$ {merchant.delivery_fee.toFixed(2)}
            </Badge>
            {merchant.opening_hours && (
              <Badge variant="outline" className="gap-1">
                <Clock className="size-3" />
                {merchant.opening_hours}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        {merchant.latitude !== null && merchant.longitude !== null && (
          <div className="mb-8">
            <h2 className="mb-3 text-lg font-medium">Localização</h2>
            <StoreMap
              latitude={merchant.latitude}
              longitude={merchant.longitude}
              label={merchant.name}
            />
          </div>
        )}

        <StoreMenu merchant={merchant} categories={categories ?? []} products={products ?? []} />
      </div>
    </div>
  );
}
