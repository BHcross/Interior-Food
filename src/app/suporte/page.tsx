import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { SupportMessage } from "@/lib/types";
import { SupportChat } from "@/components/support-chat";

export default async function SuportePage() {
  const { user } = await getCurrentUser();
  if (!user) redirect("/entrar");

  const supabase = await createClient();
  const { data: messages } = await supabase
    .from("support_messages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at")
    .returns<SupportMessage[]>();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Suporte</h1>
        <p className="text-sm text-muted-foreground">
          Manda sua dúvida direto pra gente. Antes de tudo, dá uma olhada na{" "}
          <a href="/ajuda" className="font-medium text-primary underline-offset-4 hover:underline">
            página de dúvidas frequentes
          </a>
          , sua pergunta pode já ter resposta lá.
        </p>
      </div>
      <SupportChat userId={user.id} initialMessages={messages ?? []} />
    </div>
  );
}
