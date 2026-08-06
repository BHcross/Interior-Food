"use client";

import { useMemo, useState } from "react";
import { Search, Store as StoreIcon, X } from "lucide-react";
import type { Category, Merchant, Product } from "@/lib/types";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function StoreMenu({
  merchant,
  categories,
  products,
}: {
  merchant: Merchant;
  categories: Category[];
  products: Product[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, query]);

  const uncategorized = filtered.filter((p) => !p.category_id);
  const groups = categories.map((category) => ({
    category,
    products: filtered.filter((p) => p.category_id === category.id),
  }));
  const hasResults = filtered.length > 0;

  if (products.length === 0) {
    return <p className="text-muted-foreground">Esta loja ainda não cadastrou produtos.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar no cardápio..."
          className="rounded-full pl-9 pr-9"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 right-1.5 -translate-y-1/2"
            onClick={() => setQuery("")}
            aria-label="Limpar busca"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      {!hasResults ? (
        <p className="text-muted-foreground">
          Nenhum produto encontrado para &quot;{query}&quot;.
        </p>
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
