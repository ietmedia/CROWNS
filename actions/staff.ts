"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeAdmin } from "@/lib/insforge-admin";

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
  const insforge = createInsforgeAdmin();
  const { data, error } = await insforge.database
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
  const insforge = createInsforgeAdmin();
  const { error } = await insforge.database.from("staff").insert([
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
  const insforge = createInsforgeAdmin();
  const { error } = await insforge.database
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
  const insforge = createInsforgeAdmin();
  const { error } = await insforge.database
    .from("staff")
    .update({ is_active })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/staff");
  return { success: true };
}

export async function updateStaffAvatar(id: string, avatar_url: string) {
  const insforge = createInsforgeAdmin();
  const { error } = await insforge.database
    .from("staff")
    .update({ avatar_url })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/staff");
  return { success: true };
}
