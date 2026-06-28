# Architecture

## Stack

| Layer                          | Tool                     | Purpose                                              |
| ------------------------------ | ------------------------ | ---------------------------------------------------- |
| Framework                      | Next.js 16 (App Router)  | Full stack framework                                 |
| Auth + DB + Storage            | InsForge                 | Entire backend                                       |
| Payments                       | Stripe                   | Deposits, no-show fees, booth rent, B2B invoicing    |
| Transactional email            | Resend                   | Confirmations, cancellations, campaign emails        |
| AI                             | Anthropic Claude         | Hermes agent — message personalization, copy gen     |
| Owner notifications            | Telegram Bot API         | Daily briefings, real-time booking alerts            |
| Client messaging ch. 1         | Telegram Bot API         | If client has telegram_chat_id                       |
| Client messaging ch. 2         | WhatsApp Cloud API       | Meta Graph API direct (no Twilio)                    |
| Client messaging ch. 3         | iMessage (AppleScript)   | Requires macOS host + IMESSAGE_BRIDGE_URL            |
| Calendar sync                  | Google Calendar API      | Sync appointments to owner's Google Workspace        |
| Scheduled tasks                | Vercel Cron              | Hermes runs, reminders, daily Telegram briefing      |
| Analytics                      | PostHog                  | Event tracking and booking trend charts              |
| Styling                        | Tailwind CSS + shadcn/ui | UI components and styling                            |
| Language                       | TypeScript strict        | Throughout                                           |

---

## Folder Structure

```
/
├── AGENTS.md
├── proxy.ts                                    → Two-layer route protection (Next.js 16: middleware → proxy)
├── vercel.json                                 → Cron job config for Hermes
├── context/
│   └── ...                                     → All context docs
├── app/
│   ├── layout.tsx                             → Root layout, Inter font
│   ├── page.tsx                               → Landing page
│   ├── login/page.tsx                         → Client login (email/password + Google OAuth)
│   ├── auth/callback/route.ts                → OAuth callback → sets role, upserts client
│   ├── book/
│   │   └── page.tsx                          → 4-step booking flow
│   ├── my-appointments/
│   │   └── page.tsx                          → Upcoming + past appointments
│   ├── my-profile/
│   │   └── page.tsx                          → Client profile form
│   ├── admin/
│   │   ├── login/page.tsx                    → Admin login (email + password)
│   │   ├── dashboard/page.tsx                → Stats + today's appointments
│   │   ├── calendar/page.tsx                 → Week/day calendar view
│   │   ├── bookings/page.tsx                 → All bookings table
│   │   ├── clients/
│   │   │   ├── page.tsx                      → Client list (CRM)
│   │   │   └── [id]/page.tsx                 → Individual client profile
│   │   ├── campaigns/page.tsx                → Email/SMS marketing campaigns
│   │   ├── services/page.tsx                 → Service management + gallery
│   │   ├── staff/page.tsx                    → Staff management
│   │   ├── inventory/page.tsx                → Product inventory
│   │   ├── payroll/page.tsx                  → Payroll calculator + records
│   │   ├── b2b/page.tsx                      → Business client accounts
│   │   ├── reports/page.tsx                  → Revenue charts
│   │   └── settings/page.tsx                 → Full salon settings
│   └── api/
│       ├── appointments/route.ts             → Create appointment, availability check
│       ├── availability/route.ts             → Open slots for staff + date
│       ├── stripe/
│       │   ├── checkout/route.ts             → Create deposit Checkout session
│       │   └── webhook/route.ts              → Handle Stripe events (payment + subscriptions)
│       ├── google/
│       │   ├── auth/route.ts                 → Google Calendar OAuth initiation
│       │   └── callback/route.ts             → Google Calendar OAuth callback
│       └── cron/
│           └── hermes/route.ts               → Hermes agent cron endpoint
├── agent/
│   └── hermes.ts                             → Hermes AI communication orchestrator
├── actions/
│   ├── appointments.ts                       → Create, cancel, update status
│   ├── clients.ts                            → Upsert client profile, add notes
│   ├── reviews.ts                            → Submit review after appointment
│   └── admin.ts                              → Services, staff, inventory, settings, campaigns
├── components/
│   ├── ui/                                   → shadcn/ui components only
│   ├── layout/
│   │   ├── ClientNavbar.tsx
│   │   ├── AdminSidebar.tsx
│   │   └── Footer.tsx
│   ├── homepage/
│   │   ├── Hero.tsx
│   │   ├── ServicesPreview.tsx
│   │   └── HowItWorks.tsx
│   ├── book/
│   │   ├── ServicePicker.tsx
│   │   ├── StaffPicker.tsx
│   │   ├── DateTimePicker.tsx
│   │   └── BookingConfirm.tsx
│   ├── my-appointments/
│   │   ├── AppointmentCard.tsx
│   │   └── ReviewModal.tsx
│   ├── my-profile/
│   │   └── ClientProfileForm.tsx
│   └── admin/
│       ├── dashboard/
│       │   ├── StatsBar.tsx
│       │   ├── TodayAppointments.tsx
│       │   └── RevenueChart.tsx
│       ├── calendar/
│       │   └── AppointmentCalendar.tsx
│       ├── bookings/
│       │   ├── BookingsTable.tsx
│       │   └── StatusBadge.tsx
│       ├── clients/
│       │   ├── ClientsTable.tsx
│       │   └── ClientDetail.tsx
│       ├── campaigns/
│       │   ├── CampaignForm.tsx
│       │   └── CampaignTable.tsx
│       ├── services/
│       │   ├── ServicesTable.tsx
│       │   └── ServiceForm.tsx
│       ├── staff/
│       │   ├── StaffTable.tsx
│       │   └── StaffForm.tsx
│       ├── inventory/
│       │   └── InventoryTable.tsx
│       ├── payroll/
│       │   └── PayrollTable.tsx
│       └── reports/
│           ├── RevenueByService.tsx
│           └── RevenueByStaff.tsx
├── lib/
│   ├── insforge-client.ts                    → InsForge browser client
│   ├── insforge-server.ts                    → InsForge server client
│   ├── stripe.ts                             → Stripe client
│   ├── resend.ts                             → Resend client + email templates
│   ├── anthropic.ts                          → Anthropic Claude client
│   ├── google-calendar.ts                    → Google Calendar API client
│   ├── channels/
│   │   ├── telegram.ts                       → Telegram Bot API (owner briefings + client ch.1)
│   │   ├── whatsapp.ts                       → WhatsApp Cloud API via Meta Graph (client ch.2)
│   │   ├── imessage.ts                       → iMessage via AppleScript bridge (client ch.3, optional)
│   │   └── email.ts                          → Resend wrapper (always-on fallback)
│   ├── posthog-client.ts                     → PostHog browser client
│   ├── posthog-server.ts                     → PostHog server client
│   └── utils.ts                              → Slot generation, price formatting, date helpers
└── types/
    └── index.ts                              → All TypeScript types
```

---

## System Boundaries

| Folder    | Owns                                                                          |
| --------- | ----------------------------------------------------------------------------- |
| `app/`    | Pages and API routes only. No business logic inline.                          |
| `agent/`  | Hermes orchestrator. Never imports from components or actions.                |
| `actions/`| Server Actions for UI mutations only.                                         |
| `components/` | UI only. No DB calls. No direct lib imports except shadcn/ui.            |
| `lib/`    | Third party client initialisation and shared utilities only.                  |
| `types/`  | TypeScript types shared across the project.                                   |

---

## Key Data Flows

### Booking + Stripe Deposit

```
Client submits step 4 (BookingConfirm)
        ↓
POST /api/appointments → check availability → conflict? return error
        ↓
service.deposit_cents > 0?
  YES → POST /api/stripe/checkout → Stripe Checkout session → redirect client
        → Stripe webhook: checkout.session.completed → insert appointment (confirmed, deposit_paid)
        → Hermes: send confirmation SMS + email
        → POST /api/google/sync → create Google Calendar event
  NO  → insert appointment directly (confirmed, payment: none)
        → Hermes: send confirmation SMS + email
        → create Google Calendar event
```

### Hermes Cron (every hour)

```
POST /api/cron/hermes
        ↓
agent/hermes.ts orchestrates:
  1. Query appointments starting in reminder_hours_before ± 30min → send SMS + email reminders
  2. If 8am local → send Telegram daily briefing (appointments + revenue + low stock)
  3. Check for pending approved campaigns → execute sends
  4. Weekly (Monday 9am) → re-engagement scan for inactive clients
```

### Admin Status Update → No-Show

```
Admin clicks no_show in calendar or bookings table
        ↓
Server Action: actions/appointments.ts → update status to no_show
        ↓
settings.no_show_fee_cents > 0 AND client.stripe_customer_id exists?
  YES → stripe.paymentIntents.create with customer → charge fee
        → update appointment.payment_status = fully_paid
  NO  → skip charge
        ↓
Hermes: send no-show SMS + email to client
Telegram: real-time alert to owner
```

---

## InsForge Database Schema (18 Tables)

### `clients`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | = auth.users id |
| full_name | text | |
| email | text | pre-filled from auth |
| phone | text | |
| preferred_staff_id | uuid | FK → staff, nullable |
| intake_notes | text | allergies/preferences (client editable) |
| admin_notes | text | private — admin only |
| stripe_customer_id | text | for no-show charges |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `staff`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| name | text | |
| role | text | stylist/colorist/nail_tech/esthetician/other |
| bio | text | shown in booking flow |
| avatar_url | text | InsForge Storage |
| commission_rate | decimal | e.g. 0.40 = 40% |
| is_active | boolean | inactive = hidden from booking |
| created_at | timestamptz | |

### `services`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| name | text | |
| category | text | hair/color/nails/skin/other |
| description | text | |
| duration_minutes | integer | drives slot calc + end_time |
| price_cents | integer | always stored as cents |
| deposit_cents | integer | 0 = no deposit |
| image_urls | text[] | service gallery |
| is_active | boolean | |
| created_at | timestamptz | |

### `staff_services`
| Column | Type |
|--------|------|
| staff_id | uuid FK → staff |
| service_id | uuid FK → services |

### `appointments`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| client_id | uuid | FK → clients |
| staff_id | uuid | FK → staff |
| service_id | uuid | FK → services |
| start_time | timestamptz | |
| end_time | timestamptz | always = start_time + duration_minutes |
| status | text | pending/confirmed/completed/cancelled/no_show |
| intake_notes | text | client notes at booking |
| admin_notes | text | admin notes post-booking |
| payment_status | text | none/deposit_pending/deposit_paid/fully_paid |
| stripe_session_id | text | deposit tracking |
| cancellation_reason | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `reviews`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| appointment_id | uuid | FK — one review per appointment |
| client_id | uuid | FK → clients |
| staff_id | uuid | FK → staff |
| service_id | uuid | FK → services |
| rating | integer | 1–5 |
| comment | text | optional |
| is_public | boolean | admin toggles |
| created_at | timestamptz | |

### `settings` (single row)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| salon_name | text | |
| phone | text | |
| email | text | |
| address | text | |
| open_time | time | e.g. 09:00 |
| close_time | time | e.g. 18:00 |
| slot_interval_minutes | integer | spacing between slots |
| cancellation_policy_hours | integer | free cancel window |
| no_show_fee_cents | integer | 0 = disabled |
| reminder_hours_before | integer | when Hermes sends reminders |
| google_calendar_id | text | owner's Google Calendar ID |
| google_refresh_token | text | stored after OAuth |
| telegram_bot_token | text | |
| telegram_chat_id | text | |
| hermes_reminders_enabled | boolean | |
| hermes_marketing_enabled | boolean | |
| hermes_reengagement_enabled | boolean | |
| updated_at | timestamptz | |

### `products`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| name | text | |
| category | text | retail/supply/equipment |
| sku | text | |
| description | text | |
| quantity_on_hand | integer | |
| reorder_level | integer | alert threshold |
| cost_cents | integer | |
| price_cents | integer | retail price |
| supplier_name | text | |
| supplier_contact | text | |
| image_url | text | InsForge Storage |
| is_active | boolean | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `payroll_records`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| staff_id | uuid | FK → staff |
| period_start | date | |
| period_end | date | |
| total_services | integer | count of completed appointments |
| gross_revenue_cents | integer | sum of service prices |
| commission_rate | decimal | snapshot at time of calc |
| commission_cents | integer | gross × rate |
| booth_rent_cents | integer | 0 if not a booth renter |
| net_payout_cents | integer | commission − booth_rent |
| status | text | pending/paid |
| created_at | timestamptz | |

### `booth_renters`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| staff_id | uuid | FK, unique |
| monthly_rent_cents | integer | |
| billing_day | integer | 1–28 |
| stripe_subscription_id | text | if auto-billed |
| is_active | boolean | |
| created_at | timestamptz | |

### `memberships`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| name | text | tier name (e.g. Crown Basic) |
| price_cents | integer | monthly price |
| stripe_price_id | text | Stripe recurring price |
| perks | text | description of benefits |
| is_active | boolean | |
| created_at | timestamptz | |

### `client_memberships`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| client_id | uuid | FK → clients |
| membership_id | uuid | FK → memberships |
| stripe_subscription_id | text | |
| status | text | active/cancelled/past_due |
| started_at | timestamptz | |
| ends_at | timestamptz | nullable |

### `intake_forms`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| client_id | uuid | FK → clients |
| appointment_id | uuid | FK → appointments, nullable |
| responses | jsonb | structured form answers |
| signature_url | text | InsForge Storage |
| submitted_at | timestamptz | |

### `gift_cards`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| code | text | unique redeemable code |
| amount_cents | integer | original value |
| balance_cents | integer | remaining balance |
| purchaser_id | uuid | FK → clients |
| recipient_email | text | |
| message | text | personal note |
| stripe_payment_intent_id | text | |
| redeemed_at | timestamptz | nullable |
| created_at | timestamptz | |

### `shop_products`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| name | text | |
| category | text | retail/digital |
| description | text | |
| price_cents | integer | |
| stripe_price_id | text | |
| image_url | text | InsForge Storage |
| download_url | text | for digital products |
| is_active | boolean | |
| created_at | timestamptz | |

### `campaigns`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| name | text | |
| subject | text | email subject |
| body_template | text | with {{client_name}} tokens |
| segment | text | all/inactive_30/inactive_60/custom |
| channel | text | sms/email/both |
| status | text | draft/approved/sent |
| sent_at | timestamptz | |
| sent_count | integer | |
| created_by | uuid | admin user_id |
| created_at | timestamptz | |

### `campaign_sends`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| campaign_id | uuid | FK → campaigns |
| client_id | uuid | FK → clients |
| sent_at | timestamptz | |
| status | text | sent/delivered/failed |

### `google_calendar_sync`
| Column | Type |
|--------|------|
| id | uuid |
| appointment_id | uuid FK → appointments |
| google_event_id | text |
| synced_at | timestamptz |
| last_updated | timestamptz |

---

## InsForge Storage

| Bucket | Path | Access |
|--------|------|--------|
| `avatars` | `avatars/{staff_id}.jpg` | Public read, admin write |
| `services` | `services/{service_id}/{n}.jpg` | Public read, admin write |
| `products` | `products/{product_id}.jpg` | Admin read/write |

---

## Authentication

- Client: Email + password OR Google OAuth via InsForge → `user_metadata.role = 'client'`
- Admin: Email + password via InsForge → `user_metadata.role = 'admin'` (set manually)
- `proxy.ts` enforces both layers independently (Next.js 16: middleware.ts → proxy.ts, export `proxy`)

## InsForge Client Pattern

```typescript
// lib/insforge-client.ts — browser only
import { createBrowserClient } from "@insforge/ssr";
export const insforge = createBrowserClient(
  process.env.NEXT_PUBLIC_INSFORGE_URL!,
  process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
);

// lib/insforge-server.ts — server only
import { createServerClient } from "@insforge/ssr";
import { cookies } from "next/headers";
export const createInsforgeServer = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_INSFORGE_URL!,
    process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  );
};
```

---

## Row Level Security

| Table | Client | Admin |
|-------|--------|-------|
| `clients` | Read/write own row | Read/write all |
| `appointments` | Read/write own rows | Read/write all |
| `reviews` | Insert own; read public | Read/write all |
| `staff` | Read only | Read/write all |
| `services` | Read only | Read/write all |
| `staff_services` | Read only | Read/write all |
| `settings` | Read only (hours/policy) | Read/write |
| `products` | No access | Read/write all |
| `payroll_records` | No access | Read/write all |
| `booth_renters` | No access | Read/write all |
| `memberships` | Read only (browse tiers) | Read/write all |
| `client_memberships` | Read own row | Read/write all |
| `intake_forms` | Read/write own | Read/write all |
| `gift_cards` | Read own (purchaser) | Read/write all |
| `shop_products` | Read only (active) | Read/write all |
| `campaigns` | No access | Read/write all |
| `campaign_sends` | No access | Read/write all |
| `google_calendar_sync` | No access | Read/write all |

---

## Invariants

- API routes contain no UI logic. Components contain no DB calls.
- `agent/hermes.ts` never imports from `components/` or `actions/`.
- All server-side InsForge writes use `createInsforgeServer()` — never the browser client.
- `end_time` is always `start_time + service.duration_minutes` — never set manually.
- `price_cents` and `deposit_cents` always stored as integers — divide by 100 for display.
- `deposit_cents = 0` means no deposit — no Stripe session created.
- Stripe webhook is the sole place appointments are inserted when a deposit is required.
- Appointments with status `completed`, `cancelled`, or `no_show` cannot be mutated.
- Clients can never read `admin_notes` on their own client row.
- Staff with `is_active = false` never appear in booking flow.
- Services with `is_active = false` never appear to clients.
- Hermes communication channels can be individually toggled in `settings`.
- No hardcoded hex values — always use CSS variables from ui-tokens.md.
