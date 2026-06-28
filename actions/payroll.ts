"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeAdmin } from "@/lib/insforge-admin";

export type PayrollRecord = {
  id: string;
  staff_id: string;
  period_start: string;
  period_end: string;
  total_services: number;
  gross_revenue_cents: number;
  commission_rate: number;
  commission_cents: number;
  booth_rent_cents: number;
  net_payout_cents: number;
  status: string;
  created_at: string;
  staff: { id: string; name: string } | null;
};

export type StaffPayrollSummary = {
  staff_id: string;
  staff_name: string;
  commission_rate: number;
  total_services: number;
  gross_revenue_cents: number;
  commission_cents: number;
  booth_rent_cents: number;
  net_payout_cents: number;
};

export async function calculatePayroll(
  period_start: string,
  period_end: string
): Promise<{ data: StaffPayrollSummary[]; error: string | null }> {
  const insforge = createInsforgeAdmin();

  const end = new Date(period_end);
  end.setHours(23, 59, 59, 999);

  const [apptResult, staffResult, boothResult] = await Promise.all([
    insforge.database
      .from("appointments")
      .select("id, staff_id, services(price_cents)")
      .eq("status", "completed")
      .gte("start_time", new Date(period_start).toISOString())
      .lte("start_time", end.toISOString()),
    insforge.database
      .from("staff")
      .select("id, name, commission_rate")
      .eq("is_active", true)
      .order("name"),
    insforge.database
      .from("booth_renters")
      .select("staff_id, monthly_rent_cents")
      .eq("is_active", true),
  ]);

  type ApptRow = {
    id: string;
    staff_id: string | null;
    services: { price_cents: number } | null;
  };

  const appointments = (apptResult.data ?? []) as unknown as ApptRow[];
  const staffList = (staffResult.data ?? []) as {
    id: string;
    name: string;
    commission_rate: number;
  }[];
  const boothRenters = (boothResult.data ?? []) as {
    staff_id: string;
    monthly_rent_cents: number;
  }[];

  const boothMap = new Map(boothRenters.map((b) => [b.staff_id, b.monthly_rent_cents]));

  // Group appointments by staff
  const byStaff = new Map<string, ApptRow[]>();
  for (const a of appointments) {
    if (!a.staff_id) continue;
    if (!byStaff.has(a.staff_id)) byStaff.set(a.staff_id, []);
    byStaff.get(a.staff_id)!.push(a);
  }

  const summaries: StaffPayrollSummary[] = staffList.map((s) => {
    const appts = byStaff.get(s.id) ?? [];
    const gross = appts.reduce((sum, a) => sum + (a.services?.price_cents ?? 0), 0);
    const rate = Number(s.commission_rate);
    const commission = Math.round(gross * rate);
    const booth = boothMap.get(s.id) ?? 0;
    return {
      staff_id: s.id,
      staff_name: s.name,
      commission_rate: rate,
      total_services: appts.length,
      gross_revenue_cents: gross,
      commission_cents: commission,
      booth_rent_cents: booth,
      net_payout_cents: Math.max(0, commission - booth),
    };
  });

  return { data: summaries.filter((s) => s.total_services > 0 || s.booth_rent_cents > 0), error: null };
}

export async function savePayrollRecords(
  summaries: StaffPayrollSummary[],
  period_start: string,
  period_end: string
) {
  const insforge = createInsforgeAdmin();
  const rows = summaries.map((s) => ({
    staff_id: s.staff_id,
    period_start,
    period_end,
    total_services: s.total_services,
    gross_revenue_cents: s.gross_revenue_cents,
    commission_rate: s.commission_rate,
    commission_cents: s.commission_cents,
    booth_rent_cents: s.booth_rent_cents,
    net_payout_cents: s.net_payout_cents,
    status: "pending",
  }));
  const { error } = await insforge.database.from("payroll_records").insert(rows);
  if (error) return { error: error.message };
  revalidatePath("/admin/payroll");
  return { success: true };
}

export async function markPayrollPaid(id: string) {
  const insforge = createInsforgeAdmin();
  const { error } = await insforge.database
    .from("payroll_records")
    .update({ status: "paid" })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/payroll");
  return { success: true };
}

export async function getPayrollHistory(staffId?: string) {
  const insforge = createInsforgeAdmin();
  let query = insforge.database
    .from("payroll_records")
    .select("id, staff_id, period_start, period_end, total_services, gross_revenue_cents, commission_rate, commission_cents, booth_rent_cents, net_payout_cents, status, created_at, staff(id, name)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (staffId) query = query.eq("staff_id", staffId);

  const { data, error } = await query;
  return {
    data: (data ?? []) as unknown as PayrollRecord[],
    error: error?.message ?? null,
  };
}
