"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { sendAdminSupportReply } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminSupportReplyForm({ userId }: { userId: string }) {
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    const body = draft;
    startTransition(async () => {
      const result = await sendAdminSupportReply(userId, body);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setDraft("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border/70 p-3">
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Escreva uma resposta..."
        disabled={pending}
      />
      <Button type="submit" size="icon" disabled={pending || !draft.trim()}>
        <Send />
      </Button>
    </form>
  );
}
