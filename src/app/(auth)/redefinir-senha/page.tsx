"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { updatePassword, type AuthFormState } from "@/lib/actions/auth";
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

export default function RedefinirSenhaPage() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

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
            <CardTitle className="text-xl">Nova senha</CardTitle>
            <CardDescription>Escolha uma nova senha para sua conta.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Nova senha</Label>
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
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
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
                {pending ? "Salvando..." : "Salvar nova senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
