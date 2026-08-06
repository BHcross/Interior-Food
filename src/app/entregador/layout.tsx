import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function EntregadorLayout({ children }: LayoutProps<"/entregador">) {
  const { user, profile } = await getCurrentUser();

  if (!user) redirect("/entrar");
  if (profile?.role !== "courier") redirect("/");

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Entregas</h1>
        <p className="text-sm text-muted-foreground">
          Aceite entregas disponíveis e acompanhe as suas.
        </p>
      </div>
      {children}
    </div>
  );
}
