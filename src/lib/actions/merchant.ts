"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";

async function requireMerchantOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, merchant: null };

  const { data: merchant } = await supabase
    .from("merchants")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  return { supabase, user, merchant };
}

export interface ActionResult {
  error?: string;
}

export async function saveMerchant(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user, merchant } = await requireMerchantOwner();
  if (!user) return { error: "É preciso entrar na sua conta." };

  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const openingHours = String(formData.get("openingHours") ?? "").trim();
  const deliveryFee = Number(formData.get("deliveryFee") ?? 0);

  if (!name || !city) {
    return { error: "Nome da loja e cidade são obrigatórios." };
  }

  if (merchant) {
    const { error } = await supabase
      .from("merchants")
      .update({
        name,
        city,
        address,
        phone,
        opening_hours: openingHours,
        delivery_fee: deliveryFee,
      })
      .eq("id", merchant.id);
    if (error) return { error: error.message };
  } else {
    let slug = slugify(name);
    const { data: existing } = await supabase
      .from("merchants")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    const { error } = await supabase.from("merchants").insert({
      profile_id: user.id,
      name,
      slug,
      city,
      address,
      phone,
      opening_hours: openingHours,
      delivery_fee: deliveryFee,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/painel", "layout");
  return {};
}

export async function createCategory(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, merchant } = await requireMerchantOwner();
  if (!merchant) return { error: "Cadastre sua loja primeiro." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Informe o nome da categoria." };

  const { error } = await supabase
    .from("categories")
    .insert({ merchant_id: merchant.id, name });
  if (error) return { error: error.message };

  revalidatePath("/painel/produtos");
  return {};
}

export async function deleteCategory(categoryId: string) {
  const { supabase } = await requireMerchantOwner();
  await supabase.from("categories").delete().eq("id", categoryId);
  revalidatePath("/painel/produtos");
}

export interface ProductInput {
  id?: string;
  name: string;
  description: string;
  price: number;
  categoryId: string | null;
  imageUrl: string | null;
}

export async function saveProduct(input: ProductInput): Promise<ActionResult> {
  const { supabase, merchant } = await requireMerchantOwner();
  if (!merchant) return { error: "Cadastre sua loja primeiro." };
  if (!input.name.trim() || input.price <= 0) {
    return { error: "Informe nome e preço válido." };
  }

  const payload = {
    merchant_id: merchant.id,
    name: input.name.trim(),
    description: input.description.trim() || null,
    price: input.price,
    category_id: input.categoryId,
    image_url: input.imageUrl,
  };

  const { error } = input.id
    ? await supabase.from("products").update(payload).eq("id", input.id)
    : await supabase.from("products").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/painel/produtos");
  return {};
}

export async function deleteProduct(productId: string) {
  const { supabase } = await requireMerchantOwner();
  await supabase.from("products").delete().eq("id", productId);
  revalidatePath("/painel/produtos");
}

export async function toggleProductAvailability(productId: string, available: boolean) {
  const { supabase } = await requireMerchantOwner();
  await supabase.from("products").update({ available }).eq("id", productId);
  revalidatePath("/painel/produtos");
}
