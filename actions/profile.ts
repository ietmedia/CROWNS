"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentUser, syncClient } from "@/lib/current-user";

export async function getMyProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const client = await syncClient(user);
  return (client ?? null) as {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
  } | null;
}

export async function updateMyProfile(formData: FormData) {
  const fullName = (formData.get("full_name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();

  if (!fullName || fullName.length < 2) return { error: "Please enter your name." };

  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  await syncClient(user);
  const supabase = supabaseAdmin();
  const { error } = await supabase
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
