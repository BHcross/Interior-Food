import Link from "next/link";
import { ClipboardList, ShoppingCart } from "lucide-react";

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:flex-row">
      <nav className="flex gap-2 border-b pb-4 sm:w-48 sm:flex-col sm:border-b-0 sm:border-r sm:pr-4 sm:pb-0">
        <Link
          href="/carrinho"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <ShoppingCart className="size-4" />
          Carrinho
        </Link>
        <Link
          href="/pedidos"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <ClipboardList className="size-4" />
          Meus pedidos
        </Link>
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  );
}
