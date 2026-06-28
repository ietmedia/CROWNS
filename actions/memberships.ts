"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeAdmin } from "@/lib/insforge-admin";
import { createInsforgeServer } from "@/lib/insforge-server";

export type Membership = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_cents: number;
  billing_interval: string;
  features: string[];
  stripe_price_id: string | null;
  is_active: boolean;
  created_at: string;
};

export type ClientMembership = {
  id: string;
  client_id: string;
  membership_id: string;
  stripe_subscription_id: string | null;
  status: string;
  started_at: string;
  next_billing_date: string | null;
  memberships: Membership | null;
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function getMemberships() {
  const insforge = createInsforgeAdmin();
  const { data, error } = await insforge.database
    .from("memberships")
    .select("id, name, slug, description, price_cents, billing_interval, features, stripe_price_id, is_active, created_at")
    .order("price_cents");
  return { data: (data ?? []) as unknown as Membership[], error: error?.message ?? null };
}

export async function createMembership(input: {
  name: string;
  slug: string;
  description: string;
  price_cents: number;
  billing_interval: string;
  features: string[];
  stripe_price_id: string;
}) {
  if (!input.name.trim()) return { error: "Name is required." };
  if (!input.slug.trim()) return { error: "Slug is required." };
  const insforge = createInsforgeAdmin();
  const { error } = await insforge.database.from("memberships").insert([
    {
      name: input.name.trim(),
      slug: input.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      description: input.description.trim(),
      price_cents: input.price_cents,
      billing_interval: input.billing_interval,
      features: input.features.filter(Boolean),
      stripe_price_id: input.stripe_price_id.trim() || null,
    },
  ]);
  if (error) return { error: error.message };
  revalidatePath("/admin/memberships");
  return { success: true };
}

export async function updateMembership(id: string, input: {
  name: string;
  description: string;
  price_cents: number;
  billing_interval: string;
  features: string[];
  stripe_price_id: string;
}) {
  const insforge = createInsforgeAdmin();
  const { error } = await insforge.database.from("memberships").update({
    name: input.name.trim(),
    description: input.description.trim(),
    price_cents: input.price_cents,
    billing_interval: input.billing_interval,
    features: input.features.filter(Boolean),
    stripe_price_id: input.stripe_price_id.trim() || null,
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/memberships");
  return { success: true };
}

export async function toggleMembershipActive(id: string, is_active: boolean) {
  const insforge = createInsforgeAdmin();
  const { error } = await insforge.database
    .from("memberships")
    .update({ is_active })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/memberships");
  return { success: true };
}

export async function getAdminClientMemberships() {
  const insforge = createInsforgeAdmin();
  const { data, error } = await insforge.database
    .from("client_memberships")
    .select("id, client_id, membership_id, stripe_subscription_id, status, started_at, next_billing_date, memberships(id, name, price_cents), clients(id, full_name, email)")
    .order("started_at", { ascending: false })
    .limit(50);
  return { data: (data ?? []) as unknown as Array<{
    id: string;
    client_id: string;
    stripe_subscription_id: string | null;
    status: string;
    started_at: string;
    next_billing_date: string | null;
    memberships: { id: string; name: string; price_cents: number } | null;
    clients: { id: string; full_name: string; email: string } | null;
  }>, error: error?.message ?? null };
}

export async function cancelClientMembership(id: string) {
  const insforge = createInsforgeAdmin();
  const { error } = await insforge.database
    .from("client_memberships")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/memberships");
  return { success: true };
}

// ─── Client ───────────────────────────────────────────────────────────────────

export async function getMyMembership() {
  const insforge = await createInsforgeServer();
  const { data: { user } } = await insforge.auth.getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated." };

  const { data, error } = await insforge.database
    .from("client_memberships")
    .select("id, membership_id, stripe_subscription_id, status, started_at, next_billing_date, memberships(id, name, slug, description, price_cents, billing_interval, features)")
    .eq("client_id", user.id)
    .eq("status", "active")
    .single();

  return { data: data as unknown as ClientMembership | null, error: error?.code === "PGRST116" ? null : error?.message ?? null };
}

export async function subscribeMembership(membershipId: string) {
  const insforge = await createInsforgeServer();
  const { data: { user } } = await insforge.auth.getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  // Check no active membership already
  const { data: existing, error: checkError } = await insforge.database
    .from("client_memberships")
    .select("id")
    .eq("client_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (checkError) return { error: "Failed to check membership status. Please try again." };
  if (existing) return { error: "You already have an active membership." };

  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const { error } = await insforge.database.from("client_memberships").insert([
    {
      client_id: user.id,
      membership_id: membershipId,
      status: "active",
      next_billing_date: nextMonth.toISOString().slice(0, 10),
    },
  ]);
  if (error) return { error: error.message };
  revalidatePath("/my-membership");
  return { success: true };
}

export async function cancelMyMembership(id: string) {
  const insforge = await createInsforgeServer();
  const { data: { user } } = await insforge.auth.getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await insforge.database
    .from("client_memberships")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("client_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/my-membership");
  return { success: true };
}
