"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export interface AuthFormState {
  error?: string;
  message?: string;
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const role = String(formData.get("role") ?? "customer") as Role;

  if (!email || !password || !fullName) {
    return { error: "Preencha nome, e-mail e senha." };
  }
  if (password.length < 6) {
    return { error: "A senha precisa ter pelo menos 6 caracteres." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone, role },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Se a confirmação de e-mail estiver ativada no projeto Supabase,
  // ainda não há sessão criada neste ponto.
  if (!data.session) {
    return {
      message:
        "Cadastro criado! Verifique seu e-mail para confirmar a conta antes de entrar.",
    };
  }

  if (role === "merchant") redirect("/painel/loja");
  if (role === "courier") redirect("/entregador");
  redirect("/");
}

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "E-mail ou senha inválidos." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .single();

  if (profile?.role === "merchant") redirect("/painel");
  if (profile?.role === "courier") redirect("/entregador");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
