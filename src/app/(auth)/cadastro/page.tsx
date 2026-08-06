"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Lock, Mail, Phone, Store, User } from "lucide-react";
import { signUp, type AuthFormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogoIcon } from "@/components/logo-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState: AuthFormState = {};

export default function CadastroPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const [role, setRole] = useState<"customer" | "merchant">("customer");

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
            <CardTitle className="text-xl">Criar conta</CardTitle>
            <CardDescription>Escolha o tipo de conta e preencha seus dados.</CardDescription>
          </CardHeader>
          <CardContent>
            {state.message ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="size-10 text-primary" />
                <p className="text-sm text-muted-foreground">{state.message}</p>
              </div>
            ) : (
              <>
                <Tabs value={role} onValueChange={(v) => setRole(v as typeof role)} className="mb-4">
                  <TabsList className="w-full">
                    <TabsTrigger value="customer" className="flex-1 gap-1.5">
                      <User className="size-3.5" />
                      Sou cliente
                    </TabsTrigger>
                    <TabsTrigger value="merchant" className="flex-1 gap-1.5">
                      <Store className="size-3.5" />
                      Sou lojista
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <form action={formAction} className="flex flex-col gap-4">
                  <input type="hidden" name="role" value={role} />
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="fullName">Nome completo</Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="fullName"
                        name="fullName"
                        required
                        autoComplete="name"
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        className="pl-8"
                      />
                    </div>
                  </div>
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
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        className="pl-8"
                      />
                    </div>
                  </div>
                  {state.error && <p className="text-sm text-destructive">{state.error}</p>}
                  <Button type="submit" disabled={pending} className="w-full" size="lg">
                    {pending ? "Criando conta..." : "Criar conta"}
                  </Button>
                </form>
              </>
            )}

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
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
