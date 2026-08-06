import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function EntregadorLayout({ children }: LayoutProps<"/entregador">) {
  const { user, profile } = await getCurrentUser();

  if (!user) redirect("/entrar");
  if (profile?.role !== "courier") redirect("/");

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Entregas</h1>
      {children}
    </div>
  );
}
