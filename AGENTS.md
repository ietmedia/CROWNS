<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Backend: Supabase + Clerk

This app uses **Supabase** (Postgres, Storage) for data and **Clerk** for auth.
InsForge has been fully removed.

- **Auth:** Clerk. `proxy.ts` (Next 16's renamed middleware) gates routes; `app/admin/(main)/layout.tsx` checks an `ADMIN_EMAILS` allowlist (or `publicMetadata.role === "admin"`).
- **Data access is server-only.** `lib/supabase.ts` exposes `supabaseAdmin()` — a service-role client used in Server Actions, Route Handlers, and Server Components. It bypasses RLS; every table has RLS enabled with no policies so the anon/authenticated keys read nothing. Authorization lives in the action code (user-scoped queries filter by the Clerk user id).
- **Clerk ↔ data bridge:** `lib/current-user.ts`. `getCurrentUser()` returns `{ id, email, fullName }` where `id` is the Clerk user id; `clients.id` stores that id. Call `syncClient(user)` before inserting anything that references `client_id`.
- **Schema:** `supabase/schema.sql` + `supabase/seed.sql`, run in the Supabase SQL editor.
- **Storage:** buckets `services` and `avatars` (public). Uploads go through server actions (`uploadServiceImage`, `uploadStaffAvatar`); persist both the public `url` and the object `key`.
- **Email:** `lib/email.ts` uses Resend. Without `RESEND_API_KEY` it logs and no-ops.
- **Credentials:** `.env.local` — `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, Clerk keys, `STRIPE_*`, optional `RESEND_*` and `ANTHROPIC_API_KEY`. Never hardcode or commit keys.

Key patterns:

- Supabase inserts take an array: `insert([{ ... }])` (PostgREST query syntax; embedded selects like `services(id, name)` work via FKs).
