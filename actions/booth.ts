"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeAdmin } from "@/lib/insforge-admin";

export type BoothRenter = {
  id: string;
  staff_id: string;
  monthly_rent_cents: number;
  billing_day: number;
  stripe_subscription_id: string | null;
  is_active: boolean;
  created_at: string;
};

export async function getBoothRenter(staffId: string) {
  const insforge = createInsforgeAdmin();
  const { data } = await insforge.database
    .from("booth_renters")
    .select("id, staff_id, monthly_rent_cents, billing_day, stripe_subscription_id, is_active, created_at")
    .eq("staff_id", staffId)
    .single();
  return { data: data as BoothRenter | null };
}

export async function upsertBoothRenter(
  staffId: string,
  input: {
    monthly_rent_cents: number;
    billing_day: number;
    stripe_subscription_id: string;
    is_active: boolean;
  }
) {
  const insforge = createInsforgeAdmin();
  const { data: existing } = await insforge.database
    .from("booth_renters")
    .select("id")
    .eq("staff_id", staffId)
    .single();

  if (existing) {
    const { error } = await insforge.database
      .from("booth_renters")
      .update({
        monthly_rent_cents: input.monthly_rent_cents,
        billing_day: input.billing_day,
        stripe_subscription_id: input.stripe_subscription_id || null,
        is_active: input.is_active,
      })
      .eq("staff_id", staffId);
    if (error) return { error: error.message };
  } else {
    const { error } = await insforge.database.from("booth_renters").insert([
      {
        staff_id: staffId,
        monthly_rent_cents: input.monthly_rent_cents,
        billing_day: input.billing_day,
        stripe_subscription_id: input.stripe_subscription_id || null,
        is_active: input.is_active,
      },
    ]);
    if (error) return { error: error.message };
  }

  revalidatePath(`/admin/staff/${staffId}`);
  return { success: true };
}

export async function getStaffDetail(staffId: string) {
  const insforge = createInsforgeAdmin();

  const [staffResult, apptResult, payrollResult, boothResult] = await Promise.all([
    insforge.database
      .from("staff")
      .select("id, name, role, bio, avatar_url, commission_rate, is_active, created_at")
      .eq("id", staffId)
      .single(),
    insforge.database
      .from("appointments")
      .select("id, status, start_time, services(id, name, price_cents)")
      .eq("staff_id", staffId)
      .order("start_time", { ascending: false })
      .limit(20),
    insforge.database
      .from("payroll_records")
      .select("id, period_start, period_end, net_payout_cents, status")
      .eq("staff_id", staffId)
      .order("created_at", { ascending: false })
      .limit(10),
    insforge.database
      .from("booth_renters")
      .select("id, monthly_rent_cents, billing_day, stripe_subscription_id, is_active")
      .eq("staff_id", staffId)
      .single(),
  ]);

  if (!staffResult.data) return { staff: null, appointments: [], payroll: [], booth: null };

  return {
    staff: staffResult.data as unknown as {
      id: string;
      name: string;
      role: string;
      bio: string | null;
      avatar_url: string | null;
      commission_rate: number;
      is_active: boolean;
      created_at: string;
    },
    appointments: (apptResult.data ?? []) as unknown as Array<{
      id: string;
      status: string;
      start_time: string;
      services: { id: string; name: string; price_cents: number } | null;
    }>,
    payroll: (payrollResult.data ?? []) as Array<{
      id: string;
      period_start: string;
      period_end: string;
      net_payout_cents: number;
      status: string;
    }>,
    booth: boothResult.data as {
      id: string;
      monthly_rent_cents: number;
      billing_day: number;
      stripe_subscription_id: string | null;
      is_active: boolean;
    } | null,
  };
}
