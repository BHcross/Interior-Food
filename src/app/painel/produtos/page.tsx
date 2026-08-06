import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { Category, Product } from "@/lib/types";
import { CategoryManager } from "@/components/category-manager";
import { ProductManager } from "@/components/product-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categorias</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryManager categories={categories ?? []} />
        </CardContent>
      </Card>

      <Separator />

      <div>
        <h2 className="mb-3 text-lg font-medium">Produtos</h2>
        <ProductManager
          merchantId={merchant.id}
          categories={categories ?? []}
          products={products ?? []}
        />
      </div>
    </div>
  );
}
