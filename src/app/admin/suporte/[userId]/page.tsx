import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSupportThread } from "@/lib/admin-data";
import { AdminSupportReplyForm } from "@/components/admin-support-reply-form";
import { Badge } from "@/components/ui/badge";

const ROLE_LABEL: Record<string, string> = {
  customer: "Cliente",
  merchant: "Loja",
  courier: "Entregador",
};

export default async function AdminSuporteThreadPage(
  props: PageProps<"/admin/suporte/[userId]">,
) {
  const { userId } = await props.params;
  const thread = await getSupportThread(userId);

  if (thread.messages.length === 0 && !thread.email) notFound();

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/admin/suporte"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar
      </Link>

      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{thread.name}</h1>
          <Badge variant="secondary">{ROLE_LABEL[thread.role] ?? thread.role}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{thread.email}</p>
      </div>

      <div className="flex h-[60vh] flex-col rounded-xl border border-border/70 shadow-sm">
        <div className="flex-1 overflow-y-auto p-4">
          {thread.messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma mensagem ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {thread.messages.map((message) => {
                const isAdmin = message.sender_id !== userId;
                return (
                  <div
                    key={message.id}
                    className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm ${
                      isAdmin
                        ? "self-end rounded-br-sm bg-primary text-primary-foreground"
                        : "self-start rounded-bl-sm bg-card text-card-foreground ring-1 ring-foreground/10"
                    }`}
                  >
                    {message.body}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <AdminSupportReplyForm userId={userId} />
      </div>
    </div>
  );
}
