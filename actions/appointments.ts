"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeServer } from "@/lib/insforge-server";

export async function getMyAppointments() {
  const insforge = await createInsforgeServer();
  const { data: { user } } = await insforge.auth.getCurrentUser();

  if (!user) return { data: null, error: "Not authenticated" };

  const { data, error } = await insforge.database
    .from("appointments")
    .select(
      `
      id, status, payment_status, start_time, end_time, intake_notes, created_at,
      services(id, name, duration_minutes, price_cents, deposit_cents),
      staff(id, name, role, avatar_url),
      reviews(id),
      intake_forms(id, signed_at)
    `
    )
    .eq("client_id", user.id)
    .order("start_time", { ascending: false });

  return { data, error: error?.message ?? null };
}

export async function cancelAppointment(id: string, reason: string) {
  const insforge = await createInsforgeServer();
  const { data: { user } } = await insforge.auth.getCurrentUser();

  if (!user) return { error: "Not authenticated" };

  const { data: appt } = await insforge.database
    .from("appointments")
    .select("client_id, start_time, status")
    .eq("id", id)
    .single();

  if (!appt || (appt as { client_id: string }).client_id !== user.id) {
    return { error: "Appointment not found." };
  }

  const status = (appt as { status: string }).status;
  if (!["pending", "confirmed"].includes(status)) {
    return { error: "This appointment cannot be cancelled." };
  }

  const { data: settings } = await insforge.database
    .from("settings")
    .select("cancellation_policy_hours")
    .limit(1)
    .single();

  const policyHours =
    (settings as { cancellation_policy_hours: number } | null)
      ?.cancellation_policy_hours ?? 24;
  const startTime = (appt as { start_time: string }).start_time;
  const hoursUntil =
    (new Date(startTime).getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntil < policyHours) {
    return {
      error: `Cancellations must be made at least ${policyHours} hours before the appointment.`,
    };
  }

  const { error } = await insforge.database
    .from("appointments")
    .update({
      status: "cancelled",
      cancellation_reason: reason || "Client cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("client_id", user.id);

  if (error) return { error: "Failed to cancel. Please try again." };

  revalidatePath("/my-appointments");
  return { success: true };
}
