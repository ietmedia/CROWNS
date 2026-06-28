"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeServer } from "@/lib/insforge-server";
import { createInsforgeAdmin } from "@/lib/insforge-admin";

export type IntakeForm = {
  id: string;
  client_id: string;
  appointment_id: string;
  hair_type: string | null;
  hair_density: string | null;
  hair_texture: string | null;
  concerns: string[];
  goals: string[];
  current_products: string | null;
  health_conditions: string | null;
  allergies: string | null;
  last_chemical_service: string | null;
  signature: string | null;
  signed_at: string | null;
  created_at: string;
};

export async function getIntakeForm(appointmentId: string) {
  const insforge = await createInsforgeServer();
  const { data: { user } } = await insforge.auth.getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated." };

  const { data } = await insforge.database
    .from("intake_forms")
    .select("*")
    .eq("appointment_id", appointmentId)
    .eq("client_id", user.id)
    .single();

  return { data: data as IntakeForm | null };
}

export async function getAppointmentForIntake(appointmentId: string) {
  const insforge = await createInsforgeServer();
  const { data: { user } } = await insforge.auth.getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated." };

  const { data } = await insforge.database
    .from("appointments")
    .select("id, status, start_time, services(id, name), staff(id, name)")
    .eq("id", appointmentId)
    .eq("client_id", user.id)
    .single();

  return { data: data as unknown as {
    id: string;
    status: string;
    start_time: string;
    services: { id: string; name: string } | null;
    staff: { id: string; name: string } | null;
  } | null };
}

export async function submitIntakeForm(input: {
  appointment_id: string;
  hair_type: string;
  hair_density: string;
  hair_texture: string;
  concerns: string[];
  goals: string[];
  current_products: string;
  health_conditions: string;
  allergies: string;
  last_chemical_service: string;
  signature: string;
}) {
  const insforge = await createInsforgeServer();
  const { data: { user } } = await insforge.auth.getCurrentUser();
  if (!user) return { error: "Not authenticated." };
  if (!input.signature.trim()) return { error: "Signature is required." };

  // Verify appointment belongs to this client
  const { data: appt } = await insforge.database
    .from("appointments")
    .select("id, client_id")
    .eq("id", input.appointment_id)
    .eq("client_id", user.id)
    .single();
  if (!appt) return { error: "Appointment not found." };

  const { error } = await insforge.database.from("intake_forms").insert([
    {
      client_id: user.id,
      appointment_id: input.appointment_id,
      hair_type: input.hair_type || null,
      hair_density: input.hair_density || null,
      hair_texture: input.hair_texture || null,
      concerns: input.concerns,
      goals: input.goals,
      current_products: input.current_products || null,
      health_conditions: input.health_conditions || null,
      allergies: input.allergies || null,
      last_chemical_service: input.last_chemical_service || null,
      signature: input.signature.trim(),
      signed_at: new Date().toISOString(),
    },
  ]);

  if (error?.message?.includes("unique")) return { error: "Intake form already submitted." };
  if (error) return { error: error.message };

  revalidatePath("/my-appointments");
  return { success: true };
}

export async function getAdminIntakeForms() {
  const insforge = createInsforgeAdmin();
  const { data } = await insforge.database
    .from("intake_forms")
    .select("id, signed_at, created_at, hair_type, concerns, allergies, health_conditions, clients(id, full_name), appointments(id, start_time, services(id, name))")
    .not("signed_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);
  return { data: (data ?? []) as unknown as Array<{
    id: string;
    signed_at: string;
    hair_type: string | null;
    concerns: string[];
    allergies: string | null;
    health_conditions: string | null;
    clients: { id: string; full_name: string } | null;
    appointments: { id: string; start_time: string; services: { name: string } | null } | null;
  }> };
}
