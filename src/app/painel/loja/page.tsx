import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { Merchant } from "@/lib/types";
import { MerchantForm } from "@/components/merchant-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LojaPage() {
  const { user } = await getCurrentUser();
  const supabase = await createClient();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("*")
    .eq("profile_id", user!.id)
    .maybeSingle<Merchant>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados da loja</CardTitle>
      </CardHeader>
      <CardContent>
        <MerchantForm merchant={merchant} />
      </CardContent>
    </Card>
  );
}
