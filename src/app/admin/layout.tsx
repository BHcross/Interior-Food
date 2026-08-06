import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SidebarNav, type SidebarNavItem } from "@/components/sidebar-nav";

const NAV_ITEMS: SidebarNavItem[] = [
  { href: "/admin", label: "Visão geral", icon: "dashboard", exact: true },
  { href: "/admin/contas", label: "Contas", icon: "users" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { user, profile } = await getCurrentUser();

  if (!user) redirect("/entrar");
  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:flex-row sm:py-10">
      <SidebarNav items={NAV_ITEMS} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
