"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeAdmin } from "@/lib/insforge-admin";

export type ServiceRow = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  deposit_cents: number;
  image_urls: string[];
  image_keys: string[];
  is_active: boolean;
  created_at: string;
};

export async function getServices() {
  const insforge = createInsforgeAdmin();
  const { data, error } = await insforge.database
    .from("services")
    .select(
      "id, name, category, description, duration_minutes, price_cents, deposit_cents, image_urls, image_keys, is_active, created_at"
    )
    .order("name");
  return { data: (data ?? []) as unknown as ServiceRow[], error: error?.message ?? null };
}

export async function createService(input: {
  name: string;
  category: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  deposit_cents: number;
}) {
  if (!input.name.trim()) return { error: "Name is required." };
  const insforge = createInsforgeAdmin();
  const { error } = await insforge.database.from("services").insert([
    {
      name: input.name.trim(),
      category: input.category,
      description: input.description.trim() || null,
      duration_minutes: input.duration_minutes,
      price_cents: input.price_cents,
      deposit_cents: input.deposit_cents,
    },
  ]);
  if (error) return { error: error.message };
  revalidatePath("/admin/services");
  return { success: true };
}

export async function updateService(
  id: string,
  input: {
    name: string;
    category: string;
    description: string;
    duration_minutes: number;
    price_cents: number;
    deposit_cents: number;
  }
) {
  if (!input.name.trim()) return { error: "Name is required." };
  const insforge = createInsforgeAdmin();
  const { error } = await insforge.database
    .from("services")
    .update({
      name: input.name.trim(),
      category: input.category,
      description: input.description.trim() || null,
      duration_minutes: input.duration_minutes,
      price_cents: input.price_cents,
      deposit_cents: input.deposit_cents,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/services");
  return { success: true };
}

export async function toggleServiceActive(id: string, is_active: boolean) {
  const insforge = createInsforgeAdmin();
  const { error } = await insforge.database
    .from("services")
    .update({ is_active })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/services");
  return { success: true };
}

export async function addServiceImage(serviceId: string, url: string, key: string) {
  const insforge = createInsforgeAdmin();
  const { data } = await insforge.database
    .from("services")
    .select("image_urls, image_keys")
    .eq("id", serviceId)
    .single();
  if (!data) return { error: "Service not found." };
  const current = data as { image_urls: string[]; image_keys: string[] };
  const { error } = await insforge.database
    .from("services")
    .update({
      image_urls: [...(current.image_urls ?? []), url],
      image_keys: [...(current.image_keys ?? []), key],
    })
    .eq("id", serviceId);
  if (error) return { error: error.message };
  revalidatePath("/admin/services");
  return { success: true };
}

export async function removeServiceImage(serviceId: string, imageKey: string) {
  const insforge = createInsforgeAdmin();
  // Delete from storage bucket
  await insforge.storage.from("services").remove(imageKey);
  // Remove key + url from service arrays
  const { data } = await insforge.database
    .from("services")
    .select("image_urls, image_keys")
    .eq("id", serviceId)
    .single();
  if (!data) return { error: "Service not found." };
  const current = data as { image_urls: string[]; image_keys: string[] };
  const keys = current.image_keys ?? [];
  const urls = current.image_urls ?? [];
  const idx = keys.indexOf(imageKey);
  const newKeys = [...keys];
  const newUrls = [...urls];
  if (idx !== -1) {
    newKeys.splice(idx, 1);
    newUrls.splice(idx, 1);
  }
  const { error } = await insforge.database
    .from("services")
    .update({ image_urls: newUrls, image_keys: newKeys })
    .eq("id", serviceId);
  if (error) return { error: error.message };
  revalidatePath("/admin/services");
  return { success: true };
}

export async function deleteService(id: string) {
  const insforge = createInsforgeAdmin();
  // Delete all images from storage first
  const { data } = await insforge.database
    .from("services")
    .select("image_keys")
    .eq("id", id)
    .single();
  if (data) {
    const keys = (data as { image_keys: string[] }).image_keys ?? [];
    for (const key of keys) {
      await insforge.storage.from("services").remove(key);
    }
  }
  const { error } = await insforge.database.from("services").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/services");
  return { success: true };
}
