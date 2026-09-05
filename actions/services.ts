"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";

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
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
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
  const supabase = supabaseAdmin();
  const { error } = await supabase.from("services").insert([
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
  const supabase = supabaseAdmin();
  const { error } = await supabase
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
  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("services")
    .update({ is_active })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/services");
  return { success: true };
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/** Uploads an image to the `services` bucket and appends it to the service. */
export async function uploadServiceImage(serviceId: string, formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file provided." };
  if (!IMAGE_TYPES.includes(file.type)) return { error: "Please upload an image file." };
  if (file.size > 5 * 1024 * 1024) return { error: "Image must be under 5MB." };

  const supabase = supabaseAdmin();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const key = `${serviceId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("services")
    .upload(key, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: "Upload failed. Try again." };

  const { data: pub } = supabase.storage.from("services").getPublicUrl(key);
  const url = pub.publicUrl;

  const result = await addServiceImage(serviceId, url, key);
  if (result.error) return { error: result.error };
  return { url, key };
}

export async function addServiceImage(serviceId: string, url: string, key: string) {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("services")
    .select("image_urls, image_keys")
    .eq("id", serviceId)
    .single();
  if (!data) return { error: "Service not found." };
  const current = data as { image_urls: string[]; image_keys: string[] };
  const { error } = await supabase
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
  const supabase = supabaseAdmin();
  // Delete from storage bucket
  await supabase.storage.from("services").remove([imageKey]);
  // Remove key + url from service arrays
  const { data } = await supabase
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
  const { error } = await supabase
    .from("services")
    .update({ image_urls: newUrls, image_keys: newKeys })
    .eq("id", serviceId);
  if (error) return { error: error.message };
  revalidatePath("/admin/services");
  return { success: true };
}

export async function deleteService(id: string) {
  const supabase = supabaseAdmin();
  // Delete all images from storage first
  const { data } = await supabase
    .from("services")
    .select("image_keys")
    .eq("id", id)
    .single();
  if (data) {
    const keys = (data as { image_keys: string[] }).image_keys ?? [];
    if (keys.length) await supabase.storage.from("services").remove(keys);
  }
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/services");
  return { success: true };
}
