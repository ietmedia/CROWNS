"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeServer } from "@/lib/insforge-server";

export async function getMyProfile() {
  const insforge = await createInsforgeServer();
  const { data: { user } } = await insforge.auth.getCurrentUser();
  if (!user) return null;

  const { data } = await insforge.database
    .from("clients")
    .select("id, full_name, email, phone")
    .eq("id", user.id)
    .single();

  return data as { id: string; full_name: string; email: string; phone: string | null } | null;
}

export async function updateMyProfile(formData: FormData) {
  const fullName = (formData.get("full_name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();

  if (!fullName || fullName.length < 2) return { error: "Please enter your name." };

  const insforge = await createInsforgeServer();
  const { data: { user } } = await insforge.auth.getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await insforge.database
    .from("clients")
    .update({
      full_name: fullName,
      phone: phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: "Failed to save. Please try again." };

  revalidatePath("/my-appointments");
  return { success: true };
}
