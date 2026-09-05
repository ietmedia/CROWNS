// Bridges Clerk auth → the app's `clients` table.
//
// `clients.id` holds the Clerk user id (a string like "user_2ab..."), so every
// user-scoped query filters by `getCurrentUser().id`. `syncClient()` makes sure a
// row exists for the signed-in user before we reference it as a foreign key.
import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
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

  return { id: userId, email, fullName };
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

  if (existing) return existing;

  // Insert if absent; ignore a duplicate from a concurrent request, then re-read.
  await supabase
    .from("clients")
    .upsert(
      [
        {
          id: user.id,
          email: user.email,
          full_name: user.fullName,
          preferred_channel: "email",
        },
      ],
      { onConflict: "id", ignoreDuplicates: true }
    );

  const { data: created } = await supabase
    .from("clients")
    .select(cols)
    .eq("id", user.id)
    .maybeSingle();

  return created;
}

/** Convenience: current user + guaranteed `clients` row, or null if signed out. */
export async function getCurrentClient() {
  const user = await getCurrentUser();
  if (!user) return null;
  const client = await syncClient(user);
  return { user, client };
}
