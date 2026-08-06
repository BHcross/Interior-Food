"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/lib/actions/chat";
import type { ChatChannel, OrderMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function OrderChat({
  orderId,
  channel,
  title,
}: {
  orderId: string;
  channel: ChatChannel;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));

    supabase
      .from("order_messages")
      .select("*")
      .eq("order_id", orderId)
      .eq("channel", channel)
      .order("created_at")
      .returns<OrderMessage[]>()
      .then(({ data }) => setMessages(data ?? []));

    const rtChannel = supabase
      .channel(`order-messages-${orderId}-${channel}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_messages",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const message = payload.new as OrderMessage;
          if (message.channel !== channel) return;
          setMessages((prev) => [...prev, message]);
          if (!openRef.current) setHasUnread(true);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rtChannel);
    };
  }, [orderId, channel]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ block: "end" });
  }, [open, messages]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setHasUnread(false);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    const body = draft;
    setDraft("");
    const result = await sendMessage({ orderId, channel, body });
    setSending(false);
    if (result.error) setDraft(body);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="relative" />}>
        <MessageCircle />
        Chat com {title}
        {hasUnread && (
          <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-primary" />
        )}
      </DialogTrigger>
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chat com {title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto rounded-lg border bg-muted/30 p-3">
          {messages.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma mensagem ainda. Diga oi!
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

        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Escreva uma mensagem..."
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={sending || !draft.trim()}>
            <Send />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
