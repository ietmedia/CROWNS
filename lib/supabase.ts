// Supabase service-role client — SERVER ONLY. Never import in a client component.
//
// Auth is handled by Clerk, not Supabase, so every query in this app runs
// server-side (Server Actions, Route Handlers, Server Components) with the
// service-role key. Authorization is enforced in application code — user-scoped
// queries always filter by the Clerk user id (see lib/current-user.ts).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local."
      );
    }
    _client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _client;
}
