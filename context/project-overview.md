# Project Overview

## About the Project

Crowns Enchanted is a full stack salon CRM and booking platform. Clients discover services, book appointments online, and manage their visit history from a clean client portal. The salon owner and staff manage everything from a separate admin panel — bookings, clients, services, staff schedules, and revenue — all in one place.

Two distinct sides. One platform.

---

## The Problem It Solves

Salon owners juggle client calls, manual scheduling, and disconnected tools. Clients have no way to book online, view their history, or know who's available. Crowns Enchanted fixes both sides: clients get a self-service booking experience, and the salon gets a real CRM with full visibility into their business.

---

## Pages

### Client Portal (public + authenticated)

```
/                    → Landing page — hero, services preview, book CTA
/login               → Client login (email/password or Google OAuth)
/book                → Booking flow — service → staff → date/time → confirm
/my-appointments     → Client's upcoming and past appointments
/my-profile          → Client profile — name, phone, preferences
```

### Admin Panel (admin-only)

```
/admin/login         → Admin login (separate from client login)
/admin/dashboard     → Today's appointments, revenue, quick stats
/admin/calendar      → Week/day calendar view of all bookings
/admin/bookings      → All bookings table — filter, sort, status update
/admin/clients       → Searchable client list (CRM)
/admin/clients/[id]  → Individual client profile + full appointment history
/admin/services      → Service management — add, edit, deactivate
/admin/staff         → Staff management — add staff, assign services
/admin/settings      → Salon name, hours, contact info
```

---

## Navigation

### Client navbar

Two states — logged out (landing page only) and logged in.

Logged in: **My Appointments** — **Book** — profile avatar dropdown

Full width layout on all client pages. No sidebar.

### Admin navbar

**Dashboard** — **Calendar** — **Bookings** — **Clients** — **Services** — **Staff**

Left sidebar on admin pages. Collapsible on smaller screens.

---

## Core User Flows

### Client Flow

**Discovery → Book → Manage**

1. Client lands on homepage — sees services, hero CTA
2. Client clicks Book Now → prompted to log in if not authenticated
3. Booking flow — 4 steps:
   - Step 1: Choose a service (browse by category)
   - Step 2: Choose a staff member (or "Any Available")
   - Step 3: Choose date and time (only shows available slots)
   - Step 4: Confirm — review details, submit booking
4. Booking confirmed → appears in My Appointments
5. Client can cancel upcoming appointments from My Appointments

### Admin Flow

**View → Manage → Update**

1. Admin logs into `/admin/login` with admin credentials
2. Admin Dashboard shows today at a glance — appointments, revenue, new clients
3. Admin Calendar shows all bookings in week/day view
4. Admin can update appointment status (confirmed → completed → cancelled)
5. Admin manages clients via CRM — search, view history, add notes, set preferred staff
6. Admin manages services — add/edit name, price, duration, category
7. Admin manages staff — add/edit name, role, services they offer

---

## Two Security Layers

### Layer 1 — Client Auth

- Clients register and log in via email/password or Google OAuth (InsForge)
- Role: `client` set in user metadata on first login
- Protected routes: `/my-appointments`, `/my-profile`, `/book` (step 4 confirm)
- Unauthenticated clients attempting protected routes → redirect to `/login`
- Clients can only see their own appointments (RLS scoped to user_id)

### Layer 2 — Admin Auth

- Admins log in via `/admin/login` — separate from client login
- Role: `admin` set manually in InsForge user metadata by salon owner
- Protected routes: all `/admin/*` routes except `/admin/login`
- Unauthenticated → redirect to `/admin/login`
- Authenticated but not admin → redirect to `/` (client home)
- Admins can see all data — no RLS user filter on admin queries

---

## Data Architecture

### Appointment Booking Data

- `appointments` table — source of truth for all bookings
- Status flow: `pending` → `confirmed` → `completed` (or `cancelled` at any stage)
- Clients create appointments via booking flow
- Admins update status, add notes, see all

### CRM Data

- `clients` table — one row per client user, synced from auth on first login
- Admin enriches clients with notes, preferred staff preference
- All appointment history queryable from client_id

### Availability

- Staff availability derived from `appointments` table — no separate schedule table needed for MVP
- Available time slots = salon hours minus booked appointment slots for that staff member
- Salon hours stored in `settings` table

---

## Features In Scope (36 features across 8 phases)

**Phase 1 — Foundation (complete)**
- CSS design tokens + glassmorphism system
- Landing page — hero, services preview, how it works, CTA
- Client auth — email/password + Google OAuth via InsForge
- Admin auth + two-layer route protection (proxy.ts)
- Database schema — 18 tables + RLS + seed data + 3 storage buckets

**Phase 2 — Booking Flow**
- Services browsing + gallery (/book step 1, category filters)
- Staff picker + date/time picker (steps 2–3, real availability)
- Booking confirm + Stripe deposit (step 4, webhook, no-show protection)
- Hermes: confirmation + multi-channel reminders (separate session)
- My Appointments — upcoming/past tabs, cancel with policy

**Phase 3 — Admin Core**
- Admin dashboard (4 stats + today's list, Telegram alert on new booking)
- Admin calendar + Google Calendar sync (week/day toggle)
- Admin bookings table (paginated, filters, inline status update)
- No-show protection (Stripe charge, Hermes notification)

**Phase 4 — CRM + Reviews**
- Client list (CRM) — searchable, sortable
- Client profile (admin) — two-column: info + history, admin notes, Hermes log
- Client review submission — 1–5 stars after completion, admin toggles public

**Phase 5 — Management + Reports**
- Services management + gallery upload
- Staff management (avatar, commission %, multi-select services)
- Revenue reports + PostHog charts (by service, by staff, over time)

**Phase 6 — Hermes Agent + Communication (dedicated session)**
- Hermes agent core (orchestrator, cron endpoint)
- Multi-channel client reminders (Telegram → WhatsApp → iMessage → Email)
- Multi-channel marketing campaigns (Claude drafts, admin approves)
- Telegram owner channel (8am briefing, real-time alerts)
- Re-engagement outreach (inactive 30+ days, Monday 9am)

**Phase 7 — Inventory + Payroll + Obsidian**
- Inventory management (product table, low-stock badges)
- Payroll reports (commission calc, booth rent, CSV export)
- Booth rent billing (Stripe subscription or manual)
- Obsidian second brain (Hermes writes Clients/, Briefings/, Treatments/)
- Settings — tabbed: salon info, hours, integrations, Hermes toggles, commission

**Phase 8 — Memberships + Shop + Gift Cards + Crown Concierge**
- Membership management (admin) — 5 tiers, MRR tracking
- Client membership portal — join, Stripe Customer Portal
- Structured intake forms (after first booking, signature pad)
- Gift cards (purchase, email code, redeem at booking)
- Shop (product grid, Stripe Checkout, digital downloads)
- Crown Concierge AI chat (floating widget, Claude streaming, no persistence)

---

## Features Out of Scope

- GitHub OAuth (Google + email/password only)
- Staff-facing app or portal (admin only)
- Multi-location support
- Recurring appointments
- Waitlist management
- Staff availability configuration (derived from bookings)
- Mobile app
- Video consultations
- Social media integration

---

## PostHog Events

```typescript
appointment_booked;      // { userId, serviceId, staffId, hasDeposit } — client completes booking
booking_cancelled;       // { userId, appointmentId, cancelledBy } — client or admin cancels
profile_completed;       // { userId } — client fills out full profile
service_viewed;          // { userId, serviceId, serviceName } — client views a service detail
hermes_message_sent;     // { channel, type } — server-side, Hermes sends any message
campaign_sent;           // { campaignId, segment, recipientCount, channel } — server-side
```

---

## Target Users

**Clients:**
A salon customer who:
- Wants to book appointments online without calling
- Wants to see their appointment history and upcoming visits
- Is comfortable with a mobile-friendly web experience

**Admin (Salon Owner / Staff Manager):**
A salon owner or manager who:
- Wants one place to see all bookings across staff
- Wants a real client database with visit history and notes
- Needs to manage services and staff without technical complexity

---

## Success Criteria

- Client can discover services, book an appointment, and see it confirmed in under 3 minutes
- Admin can see all of today's appointments immediately on login
- Admin can update appointment status in one click from calendar or bookings table
- Client cannot access another client's data at any point
- Non-admin users cannot access any `/admin/*` route
- All appointment slots shown to clients are actually available (no double booking)
- UI is visually consistent across client portal and admin panel
- PostHog events fire correctly for all key user actions
