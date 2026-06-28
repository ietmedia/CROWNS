"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeAdmin } from "@/lib/insforge-admin";
import { stripe } from "@/lib/stripe";
import { generateSlots } from "@/lib/utils";

// ─── Admin Create Booking (walk-in or existing client) ───────────────────────

export async function getAdminBookingFormData() {
  const insforge = createInsforgeAdmin();
  const [servicesResult, staffResult, settingsResult] = await Promise.all([
    insforge.database
      .from("services")
      .select("id, name, duration_minutes, price_cents, deposit_cents")
      .eq("is_active", true)
      .order("name"),
    insforge.database
      .from("staff")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
    insforge.database.from("settings").select("open_time, close_time, slot_interval_minutes").limit(1).single(),
  ]);
  return {
    services: (servicesResult.data ?? []) as { id: string; name: string; duration_minutes: number; price_cents: number; deposit_cents: number }[],
    staff: (staffResult.data ?? []) as { id: string; name: string }[],
    settings: (settingsResult.data ?? { open_time: "09:00", close_time: "18:00", slot_interval_minutes: 30 }) as { open_time: string; close_time: string; slot_interval_minutes: number },
  };
}

export async function getAdminAvailableSlots(date: string, serviceId: string, staffId: string | null) {
  const insforge = createInsforgeAdmin();

  const [serviceResult, settingsResult] = await Promise.all([
    insforge.database.from("services").select("duration_minutes").eq("id", serviceId).single(),
    insforge.database.from("settings").select("open_time, close_time, slot_interval_minutes").limit(1).single(),
  ]);

  let bookedQuery = insforge.database
    .from("appointments")
    .select("start_time, end_time")
    .gte("start_time", `${date}T00:00:00.000Z`)
    .lte("start_time", `${date}T23:59:59.999Z`)
    .neq("status", "cancelled");
  if (staffId) bookedQuery = bookedQuery.eq("staff_id", staffId);
  const { data: bookedData } = await bookedQuery;

  const service = serviceResult.data as { duration_minutes: number } | null;
  const settings = settingsResult.data as { open_time: string; close_time: string; slot_interval_minutes: number } | null;
  const booked = (bookedData ?? []) as { start_time: string; end_time: string }[];

  if (!service || !settings) return [];

  const allSlots = generateSlots(date, settings.open_time, settings.close_time, settings.slot_interval_minutes, service.duration_minutes);

  return allSlots.filter(slot => {
    const start = new Date(slot.start).getTime();
    const end = new Date(slot.end).getTime();
    return !booked.some(b => {
      const bs = new Date(b.start_time).getTime();
      const be = new Date(b.end_time).getTime();
      return start < be && end > bs;
    });
  });
}

export async function searchClients(query: string) {
  const insforge = createInsforgeAdmin();
  const s = `%${query}%`;
  const { data } = await insforge.database
    .from("clients")
    .select("id, full_name, email, phone")
    .or(`full_name.ilike.${s},email.ilike.${s},phone.ilike.${s}`)
    .limit(8)
    .order("full_name");
  return (data ?? []) as { id: string; full_name: string; email: string; phone: string | null }[];
}

export async function createAdminBooking(input: {
  clientId?: string;
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  serviceId: string;
  staffId: string | null;
  startTime: string;
  endTime: string;
  notes?: string;
}) {
  if (!input.clientId && !input.guestName?.trim()) {
    return { error: "Client or guest name is required." };
  }

  const insforge = createInsforgeAdmin();
  const { error } = await insforge.database.from("appointments").insert([{
    client_id: input.clientId ?? null,
    guest_name: input.guestName?.trim() ?? null,
    guest_phone: input.guestPhone?.trim() ?? null,
    guest_email: input.guestEmail?.trim() ?? null,
    service_id: input.serviceId,
    staff_id: input.staffId,
    start_time: input.startTime,
    end_time: input.endTime,
    intake_notes: input.notes?.trim() ?? null,
    status: "confirmed",
    payment_status: "none",
  }]);

  if (error) return { error: `Failed to create booking: ${error.message}` };

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/calendar");
  return { success: true };
}

// ─── Stats for Dashboard ─────────────────────────────────────────────────────

export async function getAdminStats() {
  const insforge = createInsforgeAdmin();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [apptResult, clientResult, reviewResult] = await Promise.all([
    insforge.database
      .from("appointments")
      .select(`
        id, status, payment_status, start_time, end_time, guest_name, guest_phone,
        clients(id, full_name, phone),
        staff(id, name),
        services(id, name, price_cents, deposit_cents, duration_minutes)
      `)
      .gte("start_time", todayStart.toISOString())
      .lte("start_time", todayEnd.toISOString())
      .order("start_time"),
    insforge.database
      .from("clients")
      .select("id", { count: "exact", head: true }),
    insforge.database.from("reviews").select("rating"),
  ]);

  const todayAppointments = (apptResult.data ?? []) as unknown as Array<{
    id: string;
    status: string;
    payment_status: string;
    start_time: string;
    end_time: string;
    guest_name: string | null;
    guest_phone: string | null;
    clients: { id: string; full_name: string; phone: string | null } | null;
    staff: { id: string; name: string } | null;
    services: {
      id: string;
      name: string;
      price_cents: number;
      deposit_cents: number;
      duration_minutes: number;
    } | null;
  }>;

  const todayRevenueCents = todayAppointments
    .filter((a) => ["confirmed", "completed"].includes(a.status))
    .reduce((sum, a) => {
      if (a.payment_status === "fully_paid") return sum + (a.services?.price_cents ?? 0);
      if (a.payment_status === "deposit_paid") return sum + (a.services?.deposit_cents ?? 0);
      return sum;
    }, 0);

  const ratings = (reviewResult.data ?? []) as { rating: number }[];
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
      : 0;

  return {
    todayCount: todayAppointments.length,
    todayRevenueCents,
    totalClients: clientResult.count ?? 0,
    avgRating: Math.round(avgRating * 10) / 10,
    todayAppointments,
  };
}

// ─── Appointments for a calendar week ────────────────────────────────────────

export async function getWeekAppointments(weekStart: string) {
  const insforge = createInsforgeAdmin();
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);

  const { data, error } = await insforge.database
    .from("appointments")
    .select(`
      id, status, start_time, end_time, guest_name,
      clients(id, full_name),
      staff(id, name),
      services(id, name, duration_minutes)
    `)
    .gte("start_time", start.toISOString())
    .lte("start_time", end.toISOString())
    .neq("status", "cancelled")
    .order("start_time");

  return { data: data ?? [], error: error?.message ?? null };
}

// ─── All appointments (bookings table with filters) ───────────────────────────

export async function getAdminAppointments(filters: {
  status?: string;
  staff_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}) {
  const insforge = createInsforgeAdmin();
  const page = Math.max(1, filters.page ?? 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = insforge.database
    .from("appointments")
    .select(
      `
      id, status, payment_status, start_time, end_time, created_at,
      guest_name, guest_phone,
      clients(id, full_name, email, phone),
      staff(id, name),
      services(id, name, price_cents, deposit_cents)
    `,
      { count: "exact" }
    )
    .order("start_time", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.staff_id) {
    query = query.eq("staff_id", filters.staff_id);
  }
  if (filters.date_from) {
    query = query.gte("start_time", new Date(filters.date_from).toISOString());
  }
  if (filters.date_to) {
    const end = new Date(filters.date_to);
    end.setHours(23, 59, 59, 999);
    query = query.lte("start_time", end.toISOString());
  }

  const { data, count, error } = await query;
  return {
    data: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
    error: error?.message ?? null,
  };
}

// ─── Get staff list (for filter dropdown) ────────────────────────────────────

export async function getActiveStaff() {
  const insforge = createInsforgeAdmin();
  const { data } = await insforge.database
    .from("staff")
    .select("id, name")
    .eq("is_active", true)
    .order("name");
  return data ?? [];
}

// ─── Update appointment status (inline, no-show excluded — use chargeNoShow) ─

export async function updateAppointmentStatus(id: string, status: string) {
  if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
    return { error: "Invalid status." };
  }

  const insforge = createInsforgeAdmin();
  const { error } = await insforge.database
    .from("appointments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: "Failed to update status." };

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/calendar");
  return { success: true };
}

// ─── Feature 15: Client List (CRM) ───────────────────────────────────────────

export async function getClients(filters: {
  search?: string;
  page?: number;
}) {
  const insforge = createInsforgeAdmin();
  const page = Math.max(1, filters.page ?? 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = insforge.database
    .from("clients")
    .select("id, full_name, email, phone, preferred_channel, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.search) {
    const s = `%${filters.search}%`;
    query = query.or(`full_name.ilike.${s},email.ilike.${s},phone.ilike.${s}`);
  }

  const { data, count, error } = await query;
  return {
    data: (data ?? []) as unknown as Array<{
      id: string;
      full_name: string;
      email: string;
      phone: string | null;
      preferred_channel: string;
      created_at: string;
    }>,
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
    error: error?.message ?? null,
  };
}

// ─── Feature 16: Client Profile ───────────────────────────────────────────────

export async function getClientProfile(id: string) {
  const insforge = createInsforgeAdmin();

  const [clientResult, apptResult, reviewResult, intakeResult] = await Promise.all([
    insforge.database
      .from("clients")
      .select(`
        id, full_name, email, phone, preferred_channel,
        admin_notes, stripe_customer_id, created_at, updated_at,
        staff(id, name)
      `)
      .eq("id", id)
      .single(),
    insforge.database
      .from("appointments")
      .select(`
        id, status, start_time, payment_status,
        services(id, name, price_cents),
        staff(id, name)
      `)
      .eq("client_id", id)
      .order("start_time", { ascending: false })
      .limit(15),
    insforge.database
      .from("reviews")
      .select("id, rating, comment, created_at, services(id, name)")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    insforge.database
      .from("intake_forms")
      .select(`
        id, hair_type, hair_density, hair_texture, concerns, goals,
        current_products, health_conditions, allergies,
        last_chemical_service, signed_at, created_at,
        appointments(start_time, services(name))
      `)
      .eq("client_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (clientResult.error || !clientResult.data) {
    return { client: null, appointments: [], reviews: [], intakeForm: null, error: "Client not found." };
  }

  return {
    client: clientResult.data as unknown as {
      id: string;
      full_name: string;
      email: string;
      phone: string | null;
      preferred_channel: string;
      admin_notes: string | null;
      stripe_customer_id: string | null;
      created_at: string;
      updated_at: string;
      staff: { id: string; name: string } | null;
    },
    appointments: (apptResult.data ?? []) as unknown as Array<{
      id: string;
      status: string;
      start_time: string;
      payment_status: string;
      services: { id: string; name: string; price_cents: number } | null;
      staff: { id: string; name: string } | null;
    }>,
    reviews: (reviewResult.data ?? []) as unknown as Array<{
      id: string;
      rating: number;
      comment: string | null;
      created_at: string;
      services: { id: string; name: string } | null;
    }>,
    intakeForm: intakeResult.data as unknown as {
      id: string;
      hair_type: string | null;
      hair_density: string | null;
      hair_texture: string | null;
      concerns: string | null;
      goals: string | null;
      current_products: string | null;
      health_conditions: string | null;
      allergies: string | null;
      last_chemical_service: string | null;
      signed_at: string | null;
      created_at: string;
      appointments: { start_time: string; services: { name: string } | null } | null;
    } | null,
    error: null,
  };
}

export async function updateClientAdminNotes(id: string, notes: string) {
  const insforge = createInsforgeAdmin();
  const { error } = await insforge.database
    .from("clients")
    .update({ admin_notes: notes, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: "Failed to save notes." };
  revalidatePath(`/admin/clients/${id}`);
  return { success: true };
}

// ─── Feature 14: No-Show Protection ──────────────────────────────────────────

export async function chargeNoShow(appointmentId: string) {
  const insforge = createInsforgeAdmin();

  // 1. Fetch appointment + client + settings
  const [apptResult, settingsResult] = await Promise.all([
    insforge.database
      .from("appointments")
      .select("id, status, client_id, clients(id, full_name, stripe_customer_id)")
      .eq("id", appointmentId)
      .single(),
    insforge.database
      .from("settings")
      .select("no_show_fee_cents")
      .limit(1)
      .single(),
  ]);

  if (apptResult.error || !apptResult.data) {
    return { error: "Appointment not found." };
  }

  const appt = apptResult.data as unknown as {
    id: string;
    status: string;
    client_id: string;
    clients: { id: string; full_name: string; stripe_customer_id: string | null } | null;
  };

  if (appt.status === "no_show") {
    return { error: "Already marked as no-show." };
  }

  // 2. Mark as no_show immediately
  await insforge.database
    .from("appointments")
    .update({ status: "no_show", updated_at: new Date().toISOString() })
    .eq("id", appointmentId);

  const noShowFeeCents =
    (settingsResult.data as { no_show_fee_cents: number } | null)?.no_show_fee_cents ?? 0;
  const stripeCustomerId = appt.clients?.stripe_customer_id;

  // 3. Attempt Stripe charge if configured
  let charged = false;
  let chargeError: string | null = null;

  if (
    noShowFeeCents > 0 &&
    stripeCustomerId &&
    process.env.STRIPE_SECRET_KEY
  ) {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: "card",
      });

      const pm = paymentMethods.data[0];
      if (pm) {
        await stripe.paymentIntents.create({
          amount: noShowFeeCents,
          currency: "usd",
          customer: stripeCustomerId,
          payment_method: pm.id,
          off_session: true,
          confirm: true,
          description: `No-show fee — appointment ${appointmentId}`,
        });
        charged = true;
      } else {
        chargeError = "No saved payment method on file.";
      }
    } catch (err) {
      console.error("[chargeNoShow] Stripe charge failed:", err);
      chargeError = err instanceof Error ? err.message : "Card charge failed.";
    }
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/calendar");
  return { success: true, charged, chargeError };
}
