"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Ban, Bike, Calendar, Store as StoreIcon, Trash2, User } from "lucide-react";
import { deleteAccount } from "@/lib/actions/admin";
import type { AdminAccount, AdminAccounts } from "@/lib/admin-data";
import type { Role } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type TabKey = "customers" | "merchants" | "couriers";

const TAB_LABEL: Record<TabKey, string> = {
  customers: "Clientes",
  merchants: "Lojas",
  couriers: "Entregadores",
};

const ROLE_ICON: Record<TabKey, typeof User> = {
  customers: User,
  merchants: StoreIcon,
  couriers: Bike,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function AccountRow({ account, role, tab }: { account: AdminAccount; role: Role; tab: TabKey }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const isBanned = !!account.banned_at;
  const RoleIcon = ROLE_ICON[tab];
  const displayName = account.merchant?.name ?? account.full_name ?? "Sem nome";

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteAccount(account.id, role);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setOpen(false);
      toast.success(
        res.result === "banned"
          ? "Conta bloqueada — o histórico de pedidos foi mantido."
          : "Conta excluída.",
      );
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border/70 px-4 py-3.5 first:border-t-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <RoleIcon className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{displayName}</span>
            {isBanned && (
              <Badge variant="secondary" className="gap-1">
                <Ban className="size-3" />
                Bloqueada
              </Badge>
            )}
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {account.email}
            {account.phone ? ` · ${account.phone}` : ""}
          </p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="size-3" />
            Desde {formatDate(account.created_at)}
          </p>
        </div>
      </div>

      {!isBanned && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button variant="outline" size="icon-sm" />}>
            <Trash2 />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir conta</DialogTitle>
              <DialogDescription>
                {displayName}. Se essa conta nunca teve pedido ou mensagem, ela será apagada de
                verdade. Se já tiver histórico, ela será bloqueada (não consegue mais entrar nem
                aparecer na plataforma), mas os pedidos continuam contando no total de dinheiro.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
              <Button variant="destructive" disabled={pending} onClick={handleDelete}>
                {pending ? "Excluindo..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export function AdminAccountsView({ accounts }: { accounts: AdminAccounts }) {
  const [tab, setTab] = useState<TabKey>("customers");
  const roleByTab: Record<TabKey, Role> = {
    customers: "customer",
    merchants: "merchant",
    couriers: "courier",
  };
  const list = accounts[tab];
  const total = accounts.customers.length + accounts.merchants.length + accounts.couriers.length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{total} contas no total.</p>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList>
          <TabsTrigger value="customers">
            {TAB_LABEL.customers} ({accounts.customers.length})
          </TabsTrigger>
          <TabsTrigger value="merchants">
            {TAB_LABEL.merchants} ({accounts.merchants.length})
          </TabsTrigger>
          <TabsTrigger value="couriers">
            {TAB_LABEL.couriers} ({accounts.couriers.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-xl border border-border/70">
        {list.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma conta nesta categoria.
          </p>
        ) : (
          list.map((account) => (
            <AccountRow key={account.id} account={account} role={roleByTab[tab]} tab={tab} />
          ))
        )}
      </div>
    </div>
  );
}
