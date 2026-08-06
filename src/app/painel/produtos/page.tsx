import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { Category, Product } from "@/lib/types";
import { CategoryManager } from "@/components/category-manager";
import { ProductManager } from "@/components/product-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ProdutosPage() {
  const { user } = await getCurrentUser();
  const supabase = await createClient();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("profile_id", user!.id)
    .maybeSingle();

  if (!merchant) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cadastre sua loja primeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <Button render={<Link href="/painel/loja" />} nativeButton={false}>Cadastrar loja</Button>
        </CardContent>
      </Card>
    );
  }

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
      .order("created_at", { ascending: false })
      .returns<Product[]>(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cardápio</h1>
        <p className="text-sm text-muted-foreground">
          Organize as categorias e os produtos da sua loja.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Categorias
        </h2>
        <Card className="shadow-sm">
          <CardContent>
            <CategoryManager categories={categories ?? []} />
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Produtos
        </h2>
        <ProductManager categories={categories ?? []} products={products ?? []} />
      </section>
    </div>
  );
}
