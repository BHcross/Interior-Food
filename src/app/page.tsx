import Link from "next/link";
import { MapPin, PackageSearch, SearchX, Store as StoreIcon, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Merchant, Product } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketplaceSearch } from "@/components/marketplace-search";

type ProductResult = Product & { merchants: { name: string; slug: string } };

export default async function Home(props: PageProps<"/">) {
  const { q } = await props.searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const supabase = await createClient();

  let merchantsBuilder = supabase.from("merchants").select("*").eq("status", "approved");
  if (query) merchantsBuilder = merchantsBuilder.ilike("name", `%${query}%`);
  const { data: merchants } = await merchantsBuilder.order("name").returns<Merchant[]>();

  let products: ProductResult[] = [];
  if (query) {
    const { data } = await supabase
      .from("products")
      .select("*, merchants(name, slug)")
      .eq("available", true)
      .ilike("name", `%${query}%`)
      .returns<ProductResult[]>();
    products = data ?? [];
  }

  const hasMerchants = (merchants?.length ?? 0) > 0;
  const hasProducts = products.length > 0;

  return (
    <div>
      <div className="border-b border-border/70 bg-gradient-to-b from-accent/50 via-accent/15 to-background">
        <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:py-24">
          <h1 className="mb-2 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Lojas perto de você
          </h1>
          <p className="mb-8 max-w-md text-base text-muted-foreground sm:text-lg">
            Escolha uma loja da sua cidade e monte seu pedido.
          </p>
          <div className="max-w-lg">
            <MarketplaceSearch />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:py-16">
        {query ? (
          !hasMerchants && !hasProducts ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                <SearchX className="size-7 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Nenhum resultado encontrado para &quot;{query}&quot;.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {hasMerchants && (
                <section>
                  <h2 className="mb-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                    Lojas
                  </h2>
                  <MerchantGrid merchants={merchants!} />
                </section>
              )}
              {hasProducts && (
                <section>
                  <h2 className="mb-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                    Produtos
                  </h2>
                  <div className="flex flex-col gap-3">
                    {products.map((product) => (
                      <Link key={product.id} href={`/loja/${product.merchants.slug}`}>
                        <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
                          <CardContent className="flex items-center gap-4">
                            {product.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-14 w-14 shrink-0 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <PackageSearch className="size-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {product.merchants.name}
                              </p>
                            </div>
                            <span className="font-medium text-primary">
                              R$ {product.price.toFixed(2)}
                            </span>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )
        ) : !hasMerchants ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
              <StoreIcon className="size-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Nenhuma loja disponível por aqui ainda. Volte em breve!
            </p>
          </div>
        ) : (
          <MerchantGrid merchants={merchants!} />
        )}
      </div>
    </div>
  );
}

function MerchantGrid({ merchants }: { merchants: Merchant[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {merchants.map((merchant) => (
        <Link key={merchant.id} href={`/loja/${merchant.slug}`}>
          <Card className="h-full gap-3 overflow-hidden pt-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="overflow-hidden">
              {merchant.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={merchant.logo_url}
                  alt={merchant.name}
                  className="h-36 w-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                />
              ) : (
                <div className="flex h-36 items-center justify-center bg-gradient-to-br from-primary/15 to-accent">
                  <StoreIcon className="size-9 text-primary" />
                </div>
              )}
            </div>
            <CardContent className="flex flex-col gap-2 pt-1 pb-1">
              <h2 className="text-lg font-semibold tracking-tight">{merchant.name}</h2>
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
  );
}
