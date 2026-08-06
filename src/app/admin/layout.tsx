import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { user, profile } = await getCurrentUser();

  if (!user) redirect("/entrar");
  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:flex-row">
      <nav className="flex gap-2 border-b pb-4 sm:w-48 sm:flex-col sm:border-b-0 sm:border-r sm:pr-4 sm:pb-0">
        <Link
          href="/admin"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <LayoutDashboard className="size-4" />
          Visão geral
        </Link>
        <Link
          href="/admin/contas"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <Users className="size-4" />
          Contas
        </Link>
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  );
}
