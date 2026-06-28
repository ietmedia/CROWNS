"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeAdmin } from "@/lib/insforge-admin";

export type ShopProduct = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  category: string;
  image_url: string | null;
  stripe_price_id: string | null;
  inventory: number;
  is_active: boolean;
  created_at: string;
};

export async function getShopProducts(adminView = false) {
  const insforge = createInsforgeAdmin();
  let query = insforge.database
    .from("shop_products")
    .select("id, name, description, price_cents, category, image_url, stripe_price_id, inventory, is_active, created_at")
    .order("category")
    .order("name");

  if (!adminView) query = query.eq("is_active", true);

  const { data, error } = await query;
  return { data: (data ?? []) as unknown as ShopProduct[], error: error?.message ?? null };
}

export async function createShopProduct(input: {
  name: string;
  description: string;
  price_cents: number;
  category: string;
  stripe_price_id: string;
  inventory: number;
}) {
  if (!input.name.trim()) return { error: "Name is required." };
  const insforge = createInsforgeAdmin();
  const { error } = await insforge.database.from("shop_products").insert([
    {
      name: input.name.trim(),
      description: input.description.trim() || null,
      price_cents: input.price_cents,
      category: input.category,
      stripe_price_id: input.stripe_price_id.trim() || null,
      inventory: input.inventory,
    },
  ]);
  if (error) return { error: error.message };
  revalidatePath("/shop");
  revalidatePath("/admin/shop");
  return { success: true };
}

export async function updateShopProduct(id: string, input: {
  name: string;
  description: string;
  price_cents: number;
  category: string;
  stripe_price_id: string;
  inventory: number;
}) {
  const insforge = createInsforgeAdmin();
  const { error } = await insforge.database.from("shop_products").update({
    name: input.name.trim(),
    description: input.description.trim() || null,
    price_cents: input.price_cents,
    category: input.category,
    stripe_price_id: input.stripe_price_id.trim() || null,
    inventory: input.inventory,
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/shop");
  revalidatePath("/admin/shop");
  return { success: true };
}

export async function toggleShopProductActive(id: string, is_active: boolean) {
  const insforge = createInsforgeAdmin();
  const { error } = await insforge.database
    .from("shop_products")
    .update({ is_active })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/shop");
  revalidatePath("/admin/shop");
  return { success: true };
}
