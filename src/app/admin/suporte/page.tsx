import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { getSupportThreads } from "@/lib/admin-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ROLE_LABEL: Record<string, string> = {
  customer: "Cliente",
  merchant: "Loja",
  courier: "Entregador",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminSuportePage() {
  const threads = await getSupportThreads();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Suporte</h1>
        <p className="text-sm text-muted-foreground">
          Dúvidas de clientes, lojas e entregadores.
        </p>
      </div>

      {threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <LifeBuoy className="mb-3 size-8 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma conversa de suporte ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {threads.map((thread) => (
            <Link key={thread.userId} href={`/admin/suporte/${thread.userId}`}>
              <Card className="shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{thread.name}</span>
                      <Badge variant="secondary">{ROLE_LABEL[thread.role] ?? thread.role}</Badge>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{thread.lastMessage}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDateTime(thread.lastMessageAt)}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
