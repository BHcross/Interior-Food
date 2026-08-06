import { getAccounts } from "@/lib/admin-data";
import { AdminAccountsView } from "@/components/admin-accounts";

export default async function AdminContasPage() {
  const accounts = await getAccounts();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contas</h1>
        <p className="text-sm text-muted-foreground">
          Clientes, lojas e entregadores cadastrados na plataforma.
        </p>
      </div>
      <AdminAccountsView accounts={accounts} />
    </div>
  );
}
