"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendSupportMessage } from "@/lib/actions/support";
import type { SupportMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SupportChat({
  userId,
  initialMessages,
}: {
  userId: string;
  initialMessages: SupportMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    // Espera a autenticação do realtime terminar antes de assinar o canal
    // — assinar antes disso faz o Supabase autorizar a conexão como
    // anônima, e como a tabela tem RLS, os eventos nunca chegam.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) supabase.realtime.setAuth(session.access_token);

      channel = supabase
        .channel(`support-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "support_messages",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as SupportMessage]);
          },
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    const body = draft;
    setDraft("");
    const result = await sendSupportMessage(body);
    setSending(false);
    if (result.error) {
      setDraft(body);
      toast.error(result.error);
    }
  }

  return (
    <div className="flex h-[65vh] flex-col rounded-xl border border-border/70 shadow-sm">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma mensagem ainda. Manda sua dúvida que a gente responde por aqui.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((message) => {
              const isMine = message.sender_id === userId;
              return (
                <div
                  key={message.id}
                  className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm ${
                    isMine
                      ? "self-end rounded-br-sm bg-primary text-primary-foreground"
                      : "self-start rounded-bl-sm bg-card text-card-foreground ring-1 ring-foreground/10"
                  }`}
                >
                  {message.body}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t border-border/70 p-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escreva sua dúvida..."
          disabled={sending}
        />
        <Button type="submit" size="icon" disabled={sending || !draft.trim()}>
          <Send />
        </Button>
      </form>
    </div>
  );
}
