import { Ban, Clock3, PackageCheck, Store as StoreIcon, Wallet, XCircle } from "lucide-react";
import { getRevenueByMerchant, getRevenueSummary } from "@/lib/admin-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SECTION_LABEL = "mb-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase";

export default async function AdminPage() {
  const [summary, byMerchant] = await Promise.all([
    getRevenueSummary(),
    getRevenueByMerchant(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Visão geral</h1>
        <p className="text-sm text-muted-foreground">
          Resumo financeiro e de pedidos da plataforma.
        </p>
      </div>

      <section>
        <h2 className={SECTION_LABEL}>Resumo geral</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-primary/30 bg-primary/5 lg:col-span-1">
            <CardContent className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Dinheiro movimentado</p>
                <span className="text-2xl font-semibold tabular-nums text-primary">
                  R$ {summary.totalDelivered.toFixed(2)}
                </span>
              </div>
              <Wallet className="size-5 shrink-0 text-primary" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Pedidos entregues</p>
                <span className="text-2xl font-semibold tabular-nums">
                  {summary.deliveredCount}
                </span>
              </div>
              <PackageCheck className="size-5 shrink-0 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Em andamento</p>
                <span className="text-2xl font-semibold tabular-nums">
                  {summary.inProgressCount}
                </span>
              </div>
              <Clock3 className="size-5 shrink-0 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Cancelados</p>
                <span className="text-2xl font-semibold tabular-nums">
                  {summary.cancelledCount}
                </span>
              </div>
              <XCircle className="size-5 shrink-0 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className={SECTION_LABEL}>Dinheiro movimentado por loja</h2>
        <Card>
          <CardContent className="px-0">
            {byMerchant.length === 0 ? (
              <p className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
                <StoreIcon className="size-6" />
                Nenhuma loja cadastrada.
              </p>
            ) : (
              <div className="flex flex-col">
                {byMerchant.map((m) => (
                  <div
                    key={m.merchantId}
                    className="flex items-center justify-between gap-3 border-t border-border/70 px-4 py-3.5 first:border-t-0"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-medium">{m.merchantName}</span>
                      {m.merchantStatus !== "approved" && (
                        <Badge variant="secondary" className="gap-1">
                          {m.merchantStatus === "banned" && <Ban className="size-3" />}
                          {m.merchantStatus === "banned" ? "Bloqueada" : "Pendente"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex shrink-0 items-baseline gap-2">
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {m.deliveredCount} pedido{m.deliveredCount === 1 ? "" : "s"}
                      </span>
                      <span className="w-24 text-right font-semibold tabular-nums">
                        R$ {m.totalDelivered.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
