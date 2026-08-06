import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { Merchant } from "@/lib/types";
import { MerchantForm } from "@/components/merchant-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LojaPage() {
  const { user } = await getCurrentUser();
  const supabase = await createClient();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("*")
    .eq("profile_id", user!.id)
    .maybeSingle<Merchant>();

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Dados da loja</CardTitle>
        <CardDescription>Essas informações aparecem para clientes e entregadores.</CardDescription>
      </CardHeader>
      <CardContent>
        <MerchantForm merchant={merchant} />
      </CardContent>
    </Card>
  );
}
