"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";
import { requestPasswordReset, type AuthFormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoIcon } from "@/components/logo-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState: AuthFormState = {};

export default function EsqueciSenhaPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-accent/60 to-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-1">
          <LogoIcon className="size-14 text-primary" />
          <span className="text-lg font-extrabold tracking-tight">Interior</span>
          <span className="-mt-1 text-xs font-bold tracking-[0.2em] text-primary">FOOD</span>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Esqueceu sua senha?</CardTitle>
            <CardDescription>
              Informe seu e-mail e enviaremos um link para redefinir sua senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state.message ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="size-10 text-primary" />
                <p className="text-sm text-muted-foreground">{state.message}</p>
              </div>
            ) : (
              <form action={formAction} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      className="pl-8"
                    />
                  </div>
                </div>
                {state.error && <p className="text-sm text-destructive">{state.error}</p>}
                <Button type="submit" disabled={pending} className="w-full" size="lg">
                  {pending ? "Enviando..." : "Enviar link"}
                </Button>
              </form>
            )}

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Lembrou a senha?{" "}
              <Link href="/entrar" className="font-medium text-primary underline-offset-4 hover:underline">
                Entrar
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
