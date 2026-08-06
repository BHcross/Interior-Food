import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function PainelPage() {
  const { user } = await getCurrentUser();
  const supabase = await createClient();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("*")
    .eq("profile_id", user!.id)
    .maybeSingle();

  if (!merchant) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cadastre sua loja</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground">
            Você ainda não cadastrou os dados da sua loja. Cadastre para começar a
            montar seu cardápio e receber pedidos.
          </p>
          <Button render={<Link href="/painel/loja" />} nativeButton={false} className="w-fit">
            Cadastrar loja
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { count: pendingCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("merchant_id", merchant.id)
    .eq("status", "pending");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{merchant.name}</h1>
        <Badge variant={merchant.status === "approved" ? "default" : "secondary"}>
          {merchant.status === "approved" ? "Aprovada" : "Aguardando aprovação"}
        </Badge>
      </div>

      {merchant.status !== "approved" && (
        <p className="text-sm text-muted-foreground">
          Sua loja ainda não está visível para clientes. Assim que for aprovada,
          ela aparecerá na listagem pública.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pedidos novos</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-3xl font-semibold">{pendingCount ?? 0}</span>
          <Button render={<Link href="/painel/pedidos" />} nativeButton={false} variant="outline">
            Ver pedidos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
