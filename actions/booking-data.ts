"use server";

import { supabaseAdmin } from "@/lib/supabase";
import type { Service, Staff } from "@/types";

/** Active services for the public booking flow. */
export async function getActiveServices(): Promise<Service[]> {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("name");
  return (data ?? []) as unknown as Service[];
}

/** Active staff who can perform a given service. */
export async function getStaffForService(serviceId: string): Promise<Staff[]> {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("staff_services")
    .select("staff:staff_id(id, name, role, bio, avatar_url, is_active)")
    .eq("service_id", serviceId);

  return ((data ?? []) as unknown as Array<{ staff: Staff | null }>)
    .map((row) => row.staff)
    .filter((s): s is Staff => Boolean(s && s.is_active));
}

export type BookingSettings = {
  open_time: string;
  close_time: string;
  slot_interval_minutes: number;
};

/** Salon hours + slot interval for slot generation. */
export async function getBookingSettings(): Promise<BookingSettings> {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("settings")
    .select("open_time, close_time, slot_interval_minutes")
    .limit(1)
    .maybeSingle();

  return (
    (data as BookingSettings | null) ?? {
      open_time: "09:00",
      close_time: "18:00",
      slot_interval_minutes: 30,
    }
  );
}

/**
 * Epoch-ms start times already booked around a given day (optionally for one
 * staff member). Returned as numbers so callers compare instants, never raw
 * timestamp strings — Postgres and `Date.toISOString()` format them differently.
 * The window is widened by a day on each side so bookings near a UTC/local
 * midnight boundary are still caught.
 */
export async function getBookedStarts(
  date: string,
  staffIdChoice: string
): Promise<number[]> {
  const supabase = supabaseAdmin();
  const from = new Date(`${date}T00:00:00Z`);
  from.setUTCDate(from.getUTCDate() - 1);
  const to = new Date(`${date}T00:00:00Z`);
  to.setUTCDate(to.getUTCDate() + 2);

  let query = supabase
    .from("appointments")
    .select("start_time")
    .in("status", ["pending", "confirmed"])
    .gte("start_time", from.toISOString())
    .lt("start_time", to.toISOString());

  if (staffIdChoice !== "any") query = query.eq("staff_id", staffIdChoice);

  const { data } = await query;
  return ((data ?? []) as Array<{ start_time: string }>).map((a) =>
    new Date(a.start_time).getTime()
  );
}
