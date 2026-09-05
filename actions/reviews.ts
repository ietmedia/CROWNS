"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/current-user";

export async function submitReview({
  appointmentId,
  staffId,
  serviceId,
  rating,
  comment,
}: {
  appointmentId: string;
  staffId: string;
  serviceId: string;
  rating: number;
  comment?: string;
}) {
  const supabase = supabaseAdmin();
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  if (rating < 1 || rating > 5) return { error: "Rating must be 1–5." };

  const { data: appt } = await supabase
    .from("appointments")
    .select("id, client_id, status")
    .eq("id", appointmentId)
    .eq("client_id", user.id)
    .single();

  if (!appt || (appt as { status: string }).status !== "completed") {
    return { error: "Only completed appointments can be reviewed." };
  }

  const { error } = await supabase.from("reviews").insert([
    {
      appointment_id: appointmentId,
      client_id: user.id,
      staff_id: staffId,
      service_id: serviceId,
      rating,
      comment: comment?.trim() || null,
      is_public: true,
    },
  ]);

  if (error) {
    if (error.message?.includes("unique")) {
      return { error: "You already reviewed this appointment." };
    }
    return { error: "Failed to submit review. Please try again." };
  }

  revalidatePath("/my-appointments");
  return { success: true };
}
