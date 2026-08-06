import { notFound } from "next/navigation";
import { Clock, MapPin, Store as StoreIcon, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Category, Merchant, Product } from "@/lib/types";
import { AddToCartButton } from "@/components/add-to-cart-button";
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

  const uncategorized = (products ?? []).filter((p) => !p.category_id);
  const groups = (categories ?? []).map((category) => ({
    category,
    products: (products ?? []).filter((p) => p.category_id === category.id),
  }));

  return (
    <div>
      <div className="border-b bg-gradient-to-br from-primary/10 to-accent/40">
        <div className="mx-auto w-full max-w-3xl px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/15">
              <StoreIcon className="size-6 text-primary" />
            </div>
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
        {(products ?? []).length === 0 ? (
          <p className="text-muted-foreground">Esta loja ainda não cadastrou produtos.</p>
        ) : (
          <div className="flex flex-col gap-8">
            {groups
              .filter((g) => g.products.length > 0)
              .map((group) => (
                <section key={group.category.id}>
                  <h2 className="mb-3 text-lg font-medium">{group.category.name}</h2>
                  <div className="flex flex-col gap-3">
                    {group.products.map((product) => (
                      <ProductRow key={product.id} product={product} merchant={merchant} />
                    ))}
                  </div>
                </section>
              ))}

            {uncategorized.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-medium">Outros</h2>
                <div className="flex flex-col gap-3">
                  {uncategorized.map((product) => (
                    <ProductRow key={product.id} product={product} merchant={merchant} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductRow({ product, merchant }: { product: Product; merchant: Merchant }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border bg-card p-3 shadow-sm">
      {product.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.image_url}
          alt={product.name}
          className="h-16 w-16 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
          <StoreIcon className="size-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex flex-1 flex-col">
        <span className="font-medium">{product.name}</span>
        {product.description && (
          <span className="text-sm text-muted-foreground">{product.description}</span>
        )}
        <span className="mt-1 font-medium text-primary">R$ {product.price.toFixed(2)}</span>
      </div>
      <AddToCartButton
        merchantId={merchant.id}
        merchantName={merchant.name}
        productId={product.id}
        name={product.name}
        price={product.price}
      />
    </div>
  );
}
