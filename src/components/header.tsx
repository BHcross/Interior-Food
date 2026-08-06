import Link from "next/link";
import { Bike, ClipboardList, LogOut, ShieldCheck, Store } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { CartLink } from "@/components/cart-link";
import { LogoIcon } from "@/components/logo-icon";

export async function Header() {
  const { user, profile } = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:py-4">
        <Link href="/" className="flex items-center gap-2">
          <LogoIcon className="size-8 text-primary" />
          <span className="leading-tight">
            <span className="block text-lg font-extrabold tracking-tight">Interior</span>
            <span className="block -mt-1 text-[10px] font-bold tracking-[0.2em] text-primary">
              FOOD
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {!user && (
            <>
              <Button variant="ghost" render={<Link href="/entrar" />} nativeButton={false}>
                Entrar
              </Button>
              <Button render={<Link href="/cadastro" />} nativeButton={false}>
                Cadastrar
              </Button>
            </>
          )}

          {user && profile?.role === "merchant" && (
            <Button variant="ghost" render={<Link href="/painel" />} nativeButton={false}>
              <Store />
              Painel da loja
            </Button>
          )}

          {user && profile?.role === "courier" && (
            <Button variant="ghost" render={<Link href="/entregador" />} nativeButton={false}>
              <Bike />
              Entregas
            </Button>
          )}

          {user && profile?.role === "admin" && (
            <Button variant="ghost" render={<Link href="/admin" />} nativeButton={false}>
              <ShieldCheck />
              Admin
            </Button>
          )}

          {user && profile?.role === "customer" && (
            <>
              <Button
                variant="ghost"
                render={<Link href="/pedidos" />}
                nativeButton={false}
                className="hidden sm:inline-flex"
              >
                <ClipboardList />
                Pedidos
              </Button>
              <CartLink />
            </>
          )}

          {user && (
            <form action={signOut}>
              <Button variant="outline" type="submit" size="icon" aria-label="Sair">
                <LogOut />
              </Button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
