"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeAdmin } from "@/lib/insforge-admin";

export type ProductRow = {
  id: string;
  name: string;
  category: string;
  sku: string | null;
  description: string | null;
  quantity_on_hand: number;
  reorder_level: number;
  cost_cents: number;
  price_cents: number;
  supplier_name: string | null;
  supplier_contact: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function getProducts(filters: { category?: string; low_stock?: boolean } = {}) {
  const insforge = createInsforgeAdmin();
  let query = insforge.database
    .from("products")
    .select(
      "id, name, category, sku, description, quantity_on_hand, reorder_level, cost_cents, price_cents, supplier_name, supplier_contact, is_active, created_at, updated_at"
    )
    .order("name");

  if (filters.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }

  const { data, error } = await query;
  let products = (data ?? []) as unknown as ProductRow[];

  if (filters.low_stock) {
    products = products.filter((p) => p.quantity_on_hand <= p.reorder_level);
  }

  return { data: products, error: error?.message ?? null };
}

export async function createProduct(input: {
  name: string;
  category: string;
  sku: string;
  description: string;
  quantity_on_hand: number;
  reorder_level: number;
  cost_cents: number;
  price_cents: number;
  supplier_name: string;
  supplier_contact: string;
}) {
  if (!input.name.trim()) return { error: "Name is required." };
  const insforge = createInsforgeAdmin();
  const { error } = await insforge.database.from("products").insert([
    {
      name: input.name.trim(),
      category: input.category,
      sku: input.sku.trim() || null,
      description: input.description.trim() || null,
      quantity_on_hand: input.quantity_on_hand,
      reorder_level: input.reorder_level,
      cost_cents: input.cost_cents,
      price_cents: input.price_cents,
      supplier_name: input.supplier_name.trim() || null,
      supplier_contact: input.supplier_contact.trim() || null,
    },
  ]);
  if (error) return { error: error.message };
  revalidatePath("/admin/inventory");
  return { success: true };
}

export async function updateProduct(
  id: string,
  input: {
    name: string;
    category: string;
    sku: string;
    description: string;
    quantity_on_hand: number;
    reorder_level: number;
    cost_cents: number;
    price_cents: number;
    supplier_name: string;
    supplier_contact: string;
  }
) {
  if (!input.name.trim()) return { error: "Name is required." };
  const insforge = createInsforgeAdmin();
  const { error } = await insforge.database
    .from("products")
    .update({
      name: input.name.trim(),
      category: input.category,
      sku: input.sku.trim() || null,
      description: input.description.trim() || null,
      quantity_on_hand: input.quantity_on_hand,
      reorder_level: input.reorder_level,
      cost_cents: input.cost_cents,
      price_cents: input.price_cents,
      supplier_name: input.supplier_name.trim() || null,
      supplier_contact: input.supplier_contact.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/inventory");
  return { success: true };
}

export async function adjustStock(id: string, delta: number) {
  const insforge = createInsforgeAdmin();
  const { data } = await insforge.database
    .from("products")
    .select("quantity_on_hand")
    .eq("id", id)
    .single();
  if (!data) return { error: "Product not found." };
  const current = (data as { quantity_on_hand: number }).quantity_on_hand;
  const newQty = Math.max(0, current + delta);
  const { error } = await insforge.database
    .from("products")
    .update({ quantity_on_hand: newQty, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/inventory");
  return { success: true, quantity: newQty };
}

export async function toggleProductActive(id: string, is_active: boolean) {
  const insforge = createInsforgeAdmin();
  const { error } = await insforge.database
    .from("products")
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/inventory");
  return { success: true };
}
