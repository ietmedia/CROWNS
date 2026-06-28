"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeServer } from "@/lib/insforge-server";

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
  const insforge = await createInsforgeServer();
  const {
    data: { user },
  } = await insforge.auth.getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  if (rating < 1 || rating > 5) return { error: "Rating must be 1–5." };

  const { data: appt } = await insforge.database
    .from("appointments")
    .select("id, client_id, status")
    .eq("id", appointmentId)
    .eq("client_id", user.id)
    .single();

  if (!appt || (appt as { status: string }).status !== "completed") {
    return { error: "Only completed appointments can be reviewed." };
  }

  const { error } = await insforge.database.from("reviews").insert([
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
