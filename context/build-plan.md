# Build Plan

## Core Principle

Full page UI built with mock data first — verified visually before any logic is written. Then functionality is built and wired to the UI step by step. Every feature must be visible and testable before moving to the next. No invisible backend phases.

---

## Visual Identity

This is a **luxury spiritual salon** — not a corporate SaaS app. Every page must feel premium, intimate, and on-brand.

- **Background:** deep purple (`#2D0A4E`) — dark luxury aesthetic
- **Cards:** glassmorphism — `backdrop-blur`, `bg-white/5`, `border-white/10`
- **Accent:** gold (`#D4A017`) — primary CTA, highlights
- **Display font:** Cormorant Garamond (serif, elegant) — all headings, hero text
- **Body font:** Inter — all body text, labels, nav, forms
- **Animations:** Framer Motion for page/section entrances — never jarring, always graceful
- **No hard edges** — rounded corners everywhere, generous padding, space to breathe

Reference: `/public/crowns-enchanted-TEMP/` — the actual brand site. Match this aesthetic.

---

## Phase 1 — Foundation (5 features)

### 01 — CSS Design Tokens

Write all tokens into `app/globals.css` `@theme` block (Tailwind v4). Include:
- Full purple/gold/teal/cream palette
- Both fonts declared as CSS variables
- Glassmorphism utility classes as custom CSS
- All semantic tokens (background, surface, accent, text, border)

Verify: `npm run build` passes. Render a test div with `bg-background text-gold` and confirm tokens are working.

### 02 — Landing Page UI

`app/page.tsx` — full luxury landing page matching brand. Sections:
- **Hero** — full viewport, particle canvas background, Cormorant Garamond headline, gold CTA button, glassmorphism card overlay
- **Services preview** — 6 service cards from seed data, hover glow effect
- **About Ashley** — warm copy, spiritual philosophy
- **Membership tiers** — 5 tier cards, "Content Creator" highlighted as most popular
- **Reviews** — star rating display (seed with real 5★ reviews)
- **Footer** — address, phone, social, hours

Mock data only. No DB queries yet.

### 03 — Client Auth

`app/(auth)/login/page.tsx` — Google OAuth via InsForge. On success:
- Set `user_metadata.role = 'client'`
- Upsert into `clients` table (id from auth.users, email, full_name from OAuth profile)
- Redirect → `/book`

Verify: New user can sign in with Google and land on `/book`.

### 04 — Admin Auth + Two-Layer Middleware

`app/admin/login/page.tsx` — email+password login. Same InsForge auth, different role.

`middleware.ts` — single middleware, two layers:
- `/admin/*` → check `role === 'admin'` → redirect `/admin/login` if not
- `/my-appointments`, `/my-profile`, `/book` (confirm step) → require any auth → redirect `/login`
- All other routes → public

Verify: Visiting `/admin/dashboard` unauthenticated → `/admin/login`. Visiting `/my-appointments` unauthenticated → `/login`.

### 05 — Database Schema

All tables created in InsForge. Run migrations in order:

```sql
clients, staff, services, staff_services, appointments,
reviews, settings, products, payroll_records, booth_renters,
campaigns, campaign_sends, memberships, client_memberships,
intake_forms, gift_cards, shop_products, google_calendar_sync
```

Plus RLS policies per table. Exclusion constraint on `appointments(staff_id, [start_time, end_time))`.

Seed `settings` row with real salon data:
- name: "Crowns Enchanted", phone: "470-495-8894"
- address: "2900 Delk Road SE Suite 17, Marietta GA 30067"
- hours: Tue–Sat, closed Sun–Mon

Seed 8 real services with pricing from reference site.

---

## Phase 2 — Booking Flow (5 features)

### 06 — Services Browsing + Gallery

`app/book/page.tsx` Step 1 — service selection. Category filter tabs. Service cards showing:
- Name, description, duration, price, deposit amount
- Gallery photo (from `image_urls[]`)
- "Select" button

Mock data first. Then wire to `services` table.

### 07 — Staff Picker + Date/Time Picker

Step 2 — staff filtered by selected service. Show: avatar, name, bio, role.
"Any Available" option.

Step 3 — date picker (calendar). On date select → derive available slots:
- Generate slots from `settings.open_time` to `settings.close_time` in `slot_interval_minutes` intervals
- Remove slots where `appointments` row exists for that staff in that window
- Show available slots as selectable time buttons

No availability table — derive from booked appointments at request time.

### 08 — Booking Confirm + Intake Notes + Stripe Deposit

Step 4 — summary card (service, staff, date/time, price). Intake notes textarea.

If `service.deposit_cents > 0`:
- Create Stripe Checkout session
- Redirect to Stripe hosted page
- On success webhook → insert appointment with `payment_status = 'deposit_paid'`

If no deposit → insert appointment directly with `payment_status = 'none'`.

### 09 — Hermes: Confirmation + Multi-Channel Reminders

On appointment insert:
- Send confirmation email via Resend
- If `client.telegram_chat_id` → send Telegram confirmation message
- Queue reminder: Vercel Cron picks it up when `start_time - reminder_hours_before` approaches
- Claude personalizes message with client name, service, staff, intake notes

Channel priority: Telegram → WhatsApp → iMessage → Email (always fires).

### 10 — My Appointments + Cancel with Policy

`app/my-appointments/page.tsx` — upcoming + past tabs. Each appointment card:
- Service name, staff, date/time, status badge
- "Cancel" button (only if `> cancellation_policy_hours` before start)

On cancel: update status, delete Google Calendar event, send cancellation via best available channel + email.

---

## Phase 3 — Admin Core (4 features)

### 11 — Admin Dashboard

`app/admin/dashboard/page.tsx` — four stat cards + today's appointment list.

Stats: Today's Appointments, Today's Revenue, Total Active Clients, Average Rating.

Today's list: time, client name, service, staff, status badge, inline status updater.

On new booking → Hermes sends real-time Telegram alert to owner.

### 12 — Admin Calendar + Google Calendar Sync

`app/admin/calendar/page.tsx` — week/day toggle. Each appointment as colored block (color by status). Click → slide-out detail panel.

All new appointments synced to owner's Google Workspace calendar via Google Calendar API. Event created with title `"{service} — {client_name}"`, description with intake notes. `google_calendar_sync` table stores event IDs for update/delete.

### 13 — Admin Bookings Table

`app/admin/bookings/page.tsx` — paginated table. Columns: Date/Time, Client, Service, Staff, Status, Payment.

Filters: date range picker, staff dropdown, service dropdown, status dropdown. Inline status update per row (dropdown).

### 14 — No-Show Protection

Admin marks appointment status → "No Show". If `settings.no_show_fee_cents > 0` and `client.stripe_customer_id` exists:
- Charge no-show fee via Stripe (off-session charge to saved payment method)
- Record charge in appointment row

Hermes sends no-show notification via best available channel. Separate Telegram alert to owner.

---

## Phase 4 — CRM + Reviews (3 features)

### 15 — Client List (CRM)

`app/admin/clients/page.tsx` — searchable, sortable table.

Columns: Name, Email, Phone, Total Visits, Last Visit, Lifetime Value ($), Preferred Staff.

Search by name/email/phone. Sort any column. Click row → client profile.

### 16 — Client Profile (Admin)

`app/admin/clients/[id]/page.tsx` — two-column layout.

Left: client info (editable — admin notes, preferred staff, channel preferences). Full intake form if submitted.

Right: appointment history list (all past + upcoming), total revenue, Hermes outreach log (last contacted, channel used).

Admin notes are private — never exposed to client via any route.

### 17 — Client Review Submission

After appointment marked `completed`: prompt appears in client's `/my-appointments` view.

1–5 stars + optional comment → saved to `reviews` table.

Admin toggles `is_public` on each review. Public reviews displayed on landing page `/` reviews section.

---

## Phase 5 — Management + Reports (3 features)

### 18 — Services Management + Gallery Upload

`app/admin/services/page.tsx` — card grid of all services. "Add Service" button.

Add/Edit form: name, category, description, duration (minutes), price ($), deposit ($), active toggle.

Gallery upload: drag-drop multiple images → InsForge Storage → `services/{service_id}/{index}.jpg`. Preview grid, reorder, delete.

### 19 — Staff Management

`app/admin/staff/page.tsx` — staff roster cards. "Add Staff" button.

Add/Edit: name, role, bio, avatar upload → `avatars/{staff_id}.jpg`. Commission rate (%). Multi-select services they offer (populates `staff_services`). Active toggle.

### 20 — Revenue Reports + PostHog Charts

`app/admin/reports/page.tsx` — date range selector (last 30/60/90 days, custom).

Three charts (recharts):
1. Revenue by Service (bar chart)
2. Revenue by Staff (bar chart)
3. Bookings Over Time (line chart)

Data from InsForge SQL aggregation on `appointments` WHERE status = 'completed'.

PostHog event overlay: `appointment_booked` events plotted on bookings timeline.

---

## Phase 6 — Hermes Agent + Communication (5 features)

### 21 — Hermes Agent Core

`agent/hermes.ts` — main orchestrator. Called by `POST /api/cron/hermes`.

Hermes reads:
- Upcoming appointments in the next `reminder_hours_before` window → send reminders
- Campaigns with status = 'approved' → execute sends
- Weekly scan trigger (Monday 9am) → re-engagement check

Never imports from `components/` or `actions/`. All DB access via InsForge server client.

`vercel.json` — cron schedule: `{ "path": "/api/cron/hermes", "schedule": "0 * * * *" }` (every hour).

### 22 — Multi-Channel Client Reminders

`lib/channels/telegram.ts` — `node-telegram-bot-api`
`lib/channels/whatsapp.ts` — fetch to `graph.facebook.com/v20.0/{WHATSAPP_PHONE_ID}/messages`
`lib/channels/imessage.ts` — `child_process` osascript (requires macOS host + `IMESSAGE_BRIDGE_URL`)
`lib/channels/email.ts` — Resend

Hermes priority: try Telegram → WhatsApp → iMessage → always send Email.

Claude generates personalized message body for each client using their name, upcoming service, staff name, intake notes.

### 23 — Multi-Channel Marketing Campaigns

`app/admin/campaigns/page.tsx` — campaign list + "Create Campaign" button.

Create: name, segment (all / inactive_30 / inactive_60), topic/goal. → Hermes generates draft copy via Claude. Admin previews, edits if needed, approves.

On approval: Hermes executes — sends to each client in segment via best available channel. Records each send in `campaign_sends` with `channel_used`.

### 24 — Telegram Owner Channel

Owner configures in `/admin/settings`: bot token + their personal Telegram `chat_id`.

Hermes sends to owner channel:
- 8am daily briefing: today's bookings count, yesterday's revenue, no-shows from yesterday, low-stock products
- Real-time: new booking confirmed → instant message with client name + service + time
- Real-time: cancellation or no-show

### 25 — Re-engagement Outreach

Hermes weekly scan (Monday 9am cron trigger): query clients with no completed or upcoming appointment in 30+ days.

Claude generates personalized "We miss you" message for each client.

Sends via best available channel. Records in `campaign_sends`. Skips clients with a `campaign_sends` record in the last 14 days (prevents spam).

---

## Phase 7 — Inventory + Payroll + Obsidian (5 features)

### 26 — Inventory Management

`app/admin/inventory/page.tsx` — product table. Add/edit: name, SKU, category (retail/supply/equipment), quantity on hand, reorder level, cost ($), selling price ($), supplier name + contact.

Low-stock badge when `quantity_on_hand ≤ reorder_level`. Hermes includes low-stock list in 8am Telegram briefing.

Product image upload → `products/{product_id}.jpg` bucket.

### 27 — Payroll Reports

`app/admin/payroll/page.tsx` — period selector (week/month). For each active staff:
1. Count `appointments` WHERE staff_id AND status = 'completed' in period
2. Sum revenue from those appointments
3. Apply `staff.commission_rate`
4. Subtract `booth_renters.monthly_rent_cents` if applicable

Display per-staff row with breakdown. "Generate Record" → insert `payroll_records` row. "Mark Paid" button. Export as CSV.

### 28 — Booth Rent Billing

`app/admin/staff/[id]/booth-rent/page.tsx` — configure per staff: monthly amount ($), billing day (1–28).

If `stripe_subscription_id` set → Stripe handles auto-billing via recurring subscription. Otherwise → manual billing: admin marks paid each month.

Payroll deducts booth rent automatically in the payroll calculator (feature 27).

### 29 — Obsidian Second Brain

`lib/obsidian.ts` — Hermes writes structured Markdown to Ashley's Obsidian vault via the Obsidian Local REST API community plugin.

Notes auto-created/updated:
- `Clients/{full_name}.md` — updated after each completed visit: intake summary, appointment history, products used, outreach log
- `Briefings/{YYYY-MM-DD}.md` — 8am daily briefing saved permanently
- `Treatments/{YYYY-MM-DD}-{client_name}.md` — created on appointment completion
- `Campaigns/{campaign_name}.md` — campaign execution summary

Implementation: `PUT {OBSIDIAN_REST_URL}/vault/{path}` with `Authorization: Bearer {OBSIDIAN_API_KEY}`.

Non-blocking: all writes in fire-and-forget `Promise` — if Obsidian not running or URL not set, Hermes continues silently.

### 30 — Settings (Full)

`app/admin/settings/page.tsx` — tabbed settings:
- **Salon Info** — name, address, phone, email (pre-seeded)
- **Hours + Booking** — open/close time, slot interval, cancellation policy hours, no-show fee
- **Integrations** — Google Calendar OAuth connect, Telegram bot token + owner chat_id, WhatsApp phone ID + token, Obsidian REST URL + API key
- **Hermes** — reminder timing, on/off toggles per communication type
- **Commission** — default commission rate per staff role

---

## Phase 8 — Memberships + Shop + Gift Cards + Crown Concierge (6 features)

### 31 — Membership Management (Admin)

`app/admin/memberships/page.tsx` — the 5 tiers displayed as editable cards.

Per tier: name, price, billing interval, features list (editable), Stripe Price ID, active subscriber count, MRR contribution.

Admin can manually add/remove a client from any tier (override billing).

### 32 — Client Membership Portal

`app/my-membership/page.tsx` — client sees:
- Current tier (if any) with benefits, price, next billing date
- "Manage Billing" → Stripe Customer Portal
- Other available tiers with upgrade CTA

If no membership → shows all 5 tiers with "Join" buttons → Stripe Checkout.

### 33 — Structured Intake Forms

After first booking confirmed: Resend sends intake form link to client email.

`app/intake/[token]/page.tsx` — form fields:
- Hair type (select), hair density (select), hair texture (select)
- Concerns (multi-checkbox), goals (multi-checkbox)
- Current products (textarea), health conditions (textarea), allergies (textarea)
- Last chemical service (text input)
- Digital signature (signature pad component) + consent checkbox

On submit → insert `intake_forms` row. Admin sees full form under client profile and under each appointment.

### 34 — Gift Cards

`app/gift-cards/page.tsx` — client purchases a gift card (any dollar amount) via Stripe Checkout. On payment success:
- Generate unique code (UUID-based, readable)
- Email code + message to recipient via Resend
- Record in `gift_cards` table

`app/admin/gift-cards/page.tsx` — admin view: all cards, codes, balances, purchased by, used/unused.

Code redeemable at booking step 4 — client enters code, balance deducted from total, remainder charged if any.

### 35 — Shop

`app/shop/page.tsx` — product grid. Categories: kits, ebooks, digital downloads, retail.

Each product: image, name, description, price. "Buy" → Stripe Checkout.

On digital product purchase: Resend sends download link email.
On physical product purchase: admin `app/admin/shop/orders/` view, marks shipped, enters tracking.

`app/admin/shop/page.tsx` — CRUD for shop products. Inventory tracking for physical items.

### 36 — Crown Concierge AI Chat

Floating chat widget (bottom-right) on all `/(client)` layout pages. Replicates the widget from reference site.

`app/api/ai/chat/route.ts` — `POST` → Anthropic Claude via `@anthropic-ai/sdk`.

System prompt includes:
- Ashley's full service menu with pricing and durations
- Membership tiers and benefits
- Salon hours and location
- Philosophy and spiritual approach
- Booking instructions (link to `/book` or call 470-495-8894)
- If client is logged in: their intake form summary and appointment history

Persona: warm, spiritual, knowledgeable hair consultant — never robotic, never clinical.

Chat history stored in component state (not DB). No persistence across sessions.

---

## Verification Checkpoints

| Phase | Test |
|-------|------|
| 1 | `npm run build` passes; `bg-background` is deep purple, `text-gold` is gold |
| 1 | Landing page renders with glassmorphism hero and Cormorant Garamond headlines |
| 2 | Full booking flow → Stripe → My Appointments; confirmation email received |
| 2 | Available slot disappears after booking (derived correctly) |
| 3 | Admin sees all bookings; no-show fee charged in Stripe test mode |
| 3 | New appointment appears in owner's Google Calendar within 30s |
| 4 | Client A cannot read Client B's appointments (RLS enforced) |
| 4 | Admin notes NOT visible to client via any route |
| 5 | Revenue charts show correct totals from completed appointments |
| 6 | Hermes cron fires; reminder arrives via Telegram before appointment |
| 6 | Telegram owner briefing arrives at 8am with correct data |
| 6 | New booking → real-time Telegram alert to owner within 60s |
| 7 | Obsidian client note updated after appointment marked complete |
| 7 | Payroll calculator: commission - booth rent = correct net payout |
| 8 | Membership Stripe subscription charges correct amount per tier |
| 8 | Gift card code reduces booking total and updates `balance_cents` |
| 8 | Crown Concierge responds with correct service prices and hours |
| Middleware | `/admin/dashboard` → unauthenticated → `/admin/login` |
| Middleware | `/my-appointments` → unauthenticated → `/login` |
| Middleware | `/admin/*` → client role → redirect to `/` |
