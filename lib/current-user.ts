// Bridges Clerk auth → the app's `clients` table.
//
// `clients.id` holds the Clerk user id (a string like "user_2ab..."), so every
// user-scoped query filters by `getCurrentUser().id`. `syncClient()` makes sure a
// row exists for the signed-in user before we reference it as a foreign key.
import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

const emailNorm = (v: string) => {
  const e = v.trim().toLowerCase();
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(e) ? e : null;
};
const phoneNorm = (v: string | null) => {
  const d = (v ?? "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) return d.slice(1);
  return d.length >= 10 ? d.slice(-10) : null;
};

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
};

/** Returns the signed-in Clerk user mapped to app fields, or null. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "";
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    email.split("@")[0] ||
    "Guest";
  const phone =
    user?.primaryPhoneNumber?.phoneNumber ??
    user?.phoneNumbers?.[0]?.phoneNumber ??
    null;

  return { id: userId, email, fullName, phone };
}

/**
 * Ensures a `clients` row exists for this user and returns it.
 * Call before inserting anything that references `client_id`.
 */
export async function syncClient(user: CurrentUser) {
  const supabase = supabaseAdmin();
  const cols = "id, full_name, email, phone, stripe_customer_id";

  const { data: existing } = await supabase
    .from("clients")
    .select(cols)
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    // Backfill a phone captured by Clerk if the row predates it.
    if (user.phone && !(existing as { phone: string | null }).phone) {
      await supabase.from("clients").update({ phone: user.phone }).eq("id", user.id);
      return { ...existing, phone: user.phone };
    }
    return existing;
  }

  // Insert if absent; ignore a duplicate from a concurrent request, then re-read.
  await supabase
    .from("clients")
    .upsert(
      [
        {
          id: user.id,
          email: user.email,
          full_name: user.fullName,
          phone: user.phone,
          preferred_channel: "email",
        },
      ],
      { onConflict: "id", ignoreDuplicates: true }
    );

  // First sign-up for this user — link any matching imported contact.
  await claimImportedClient(user, supabase);

  const { data: created } = await supabase
    .from("clients")
    .select(cols)
    .eq("id", user.id)
    .maybeSingle();

  return created;
}

/**
 * Looks for an unclaimed row in `imported_clients` matching this user's email
 * or phone (e.g. a contact brought over from Vagaro), copies the useful bits
 * onto their fresh `clients` row, and marks the import row claimed. No-op when
 * there's no match or the staging table doesn't exist.
 */
async function claimImportedClient(user: CurrentUser, supabase: SupabaseClient) {
  const em = emailNorm(user.email);
  const ph = phoneNorm(user.phone);
  if (!em && !ph) return;

  const ors: string[] = [];
  if (em) ors.push(`email_norm.eq.${em}`);
  if (ph) ors.push(`phone_norm.eq.${ph}`);

  const { data, error } = await supabase
    .from("imported_clients")
    .select("id, full_name, phone, notes, tags, last_visit, total_visits")
    .is("claimed_by", null)
    .or(ors.join(","))
    .order("last_visit", { ascending: false, nullsFirst: false })
    .limit(1);

  if (error || !data?.length) return;
  const imp = data[0] as {
    id: string;
    full_name: string | null;
    phone: string | null;
    notes: string | null;
    tags: string | null;
    last_visit: string | null;
    total_visits: number | null;
  };

  const patch: Record<string, unknown> = {};
  if (!user.phone && imp.phone) patch.phone = imp.phone;
  // Prefer the imported name only if Clerk gave us a weak one.
  const weakName = !user.fullName || user.fullName === "Guest" || user.fullName === user.email.split("@")[0];
  if (weakName && imp.full_name) patch.full_name = imp.full_name;

  const history = [
    "Imported from Vagaro.",
    imp.last_visit ? `Last visit ${imp.last_visit}.` : null,
    imp.total_visits ? `${imp.total_visits} prior visits.` : null,
    imp.tags ? `Tags: ${imp.tags}.` : null,
    imp.notes ? `Notes: ${imp.notes}` : null,
  ].filter(Boolean).join(" ");
  patch.admin_notes = history;

  await supabase.from("clients").update(patch).eq("id", user.id);
  await supabase
    .from("imported_clients")
    .update({ claimed_by: user.id, claimed_at: new Date().toISOString() })
    .eq("id", imp.id);
}

/** Convenience: current user + guaranteed `clients` row, or null if signed out. */
export async function getCurrentClient() {
  const user = await getCurrentUser();
  if (!user) return null;
  const client = await syncClient(user);
  return { user, client };
}
