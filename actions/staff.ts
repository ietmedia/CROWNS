"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";

export type StaffRow = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  avatar_url: string | null;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
};

export async function getStaff() {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("staff")
    .select("id, name, role, bio, avatar_url, commission_rate, is_active, created_at")
    .order("name");
  return { data: (data ?? []) as unknown as StaffRow[], error: error?.message ?? null };
}

export async function createStaff(input: {
  name: string;
  role: string;
  bio: string;
  commission_rate: number;
}) {
  if (!input.name.trim()) return { error: "Name is required." };
  const supabase = supabaseAdmin();
  const { error } = await supabase.from("staff").insert([
    {
      name: input.name.trim(),
      role: input.role,
      bio: input.bio.trim() || null,
      commission_rate: input.commission_rate,
    },
  ]);
  if (error) return { error: error.message };
  revalidatePath("/admin/staff");
  return { success: true };
}

export async function updateStaff(
  id: string,
  input: {
    name: string;
    role: string;
    bio: string;
    commission_rate: number;
  }
) {
  if (!input.name.trim()) return { error: "Name is required." };
  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("staff")
    .update({
      name: input.name.trim(),
      role: input.role,
      bio: input.bio.trim() || null,
      commission_rate: input.commission_rate,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/staff");
  return { success: true };
}

export async function toggleStaffActive(id: string, is_active: boolean) {
  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("staff")
    .update({ is_active })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/staff");
  return { success: true };
}

export async function updateStaffAvatar(id: string, avatar_url: string) {
  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("staff")
    .update({ avatar_url })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/staff");
  return { success: true };
}

const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/** Uploads an avatar to the `avatars` bucket and sets it on the staff row. */
export async function uploadStaffAvatar(id: string, formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file provided." };
  if (!AVATAR_TYPES.includes(file.type)) return { error: "Please upload an image file." };
  if (file.size > 5 * 1024 * 1024) return { error: "Image must be under 5MB." };

  const supabase = supabaseAdmin();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const key = `${id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(key, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: "Upload failed. Try again." };

  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(key);
  const url = pub.publicUrl;

  const result = await updateStaffAvatar(id, url);
  if (result.error) return { error: result.error };
  return { url };
}
