import { SidebarNav, type SidebarNavItem } from "@/components/sidebar-nav";

const NAV_ITEMS: SidebarNavItem[] = [
  { href: "/carrinho", label: "Carrinho", icon: "cart" },
  { href: "/pedidos", label: "Meus pedidos", icon: "orders" },
];

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:flex-row sm:py-10">
      <SidebarNav items={NAV_ITEMS} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
