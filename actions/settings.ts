"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeAdmin } from "@/lib/insforge-admin";

const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

export type SalonSettings = {
  id: string;
  salon_name: string;
  phone: string;
  email: string;
  address: string;
  open_time: string;
  close_time: string;
  slot_interval_minutes: number;
  cancellation_policy_hours: number;
  no_show_fee_cents: number;
  reminder_hours_before: number;
  google_calendar_id: string | null;
};

export async function getSettings(): Promise<{ data: SalonSettings | null; error: string | null }> {
  const insforge = createInsforgeAdmin();
  const { data, error } = await insforge.database
    .from("settings")
    .select(
      "id, salon_name, phone, email, address, open_time, close_time, slot_interval_minutes, cancellation_policy_hours, no_show_fee_cents, reminder_hours_before, google_calendar_id"
    )
    .eq("id", SETTINGS_ID)
    .single();

  return { data: data as SalonSettings | null, error: error?.message ?? null };
}

export async function updateSettings(input: {
  salon_name: string;
  phone: string;
  email: string;
  address: string;
  open_time: string;
  close_time: string;
  slot_interval_minutes: number;
  cancellation_policy_hours: number;
  no_show_fee_cents: number;
  reminder_hours_before: number;
  google_calendar_id: string;
}) {
  if (!input.salon_name.trim()) return { error: "Salon name is required." };

  const insforge = createInsforgeAdmin();
  const { data: existing } = await insforge.database
    .from("settings")
    .select("id")
    .eq("id", SETTINGS_ID)
    .single();

  const payload = {
    salon_name: input.salon_name.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    address: input.address.trim(),
    open_time: input.open_time,
    close_time: input.close_time,
    slot_interval_minutes: input.slot_interval_minutes,
    cancellation_policy_hours: input.cancellation_policy_hours,
    no_show_fee_cents: input.no_show_fee_cents,
    reminder_hours_before: input.reminder_hours_before,
    google_calendar_id: input.google_calendar_id.trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await insforge.database
      .from("settings")
      .update(payload)
      .eq("id", SETTINGS_ID);
    if (error) return { error: error.message };
  } else {
    const { error } = await insforge.database
      .from("settings")
      .insert([{ id: SETTINGS_ID, ...payload }]);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}
