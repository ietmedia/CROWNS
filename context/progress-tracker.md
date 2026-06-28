# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** COMPLETE — All 30 non-Hermes features built
**Last completed:** 36 Crown Concierge AI Chat (Phase 8 complete)
**Next:** Phase 6 Hermes Agent (deferred to dedicated session)

---

## Progress

### Phase 1 — Foundation

- [x] 01 CSS Design Tokens — `app/globals.css` complete
- [x] 02 Landing Page UI — Hero, ServicesPreview, HowItWorks, ClientNavbar, Footer
- [x] 03 Client Auth (email/password + Google OAuth) — `app/login/page.tsx`, `app/auth/callback/route.ts`, `actions/auth.ts`
- [x] 04 Admin Auth + Two-Layer Middleware — `app/admin/login/page.tsx`, `proxy.ts`, AdminSidebar, admin layout
- [x] 05 Database Schema (18 tables + RLS + seed data) — migration applied; 3 storage buckets created (avatars, services, products)

### Phase 2 — Booking Flow

- [x] 06 Services Browsing + Gallery — `app/book/page.tsx`, `components/booking/Step1Services.tsx`
- [x] 07 Staff Picker + Date/Time Picker — `components/booking/Step2Staff.tsx`, `components/booking/Step3DateTime.tsx`
- [x] 08 Booking Confirm + Intake Notes + Stripe Deposit — `components/booking/Step4Confirm.tsx`, `actions/booking.ts`, `app/api/stripe/webhook/route.ts`, `lib/stripe.ts`
- [x] 09 Booking Confirmation Email — `lib/email.ts` (InsForge emails), wired in `app/api/stripe/webhook/route.ts` on `checkout.session.completed`
- [x] 10 My Appointments + Cancel with Policy — `app/my-appointments/page.tsx`, `components/appointments/AppointmentsList.tsx`, `actions/appointments.ts`

### Phase 3 — Admin Core

- [x] 11 Admin Dashboard — `app/admin/(main)/dashboard/page.tsx`, real stats + today's list + inline status update
- [x] 12 Admin Calendar — `app/admin/(main)/calendar/page.tsx`, `components/admin/WeekCalendar.tsx`, week view with navigation
- [x] 13 Admin Bookings Table — `app/admin/(main)/bookings/page.tsx`, paginated + date/staff/status filters + inline update
- [x] 14 No-Show Protection — `actions/admin.ts:chargeNoShow`, marks no_show + attempts Stripe off-session charge

### Phase 4 — CRM + Reviews

- [x] 15 Client List (CRM) — `app/admin/(main)/clients/page.tsx`, search + paginated table
- [x] 16 Client Profile (Admin) — `app/admin/(main)/clients/[id]/page.tsx`, stats + history + admin notes editor
- [x] 17 Client Review Submission — `components/appointments/ReviewForm.tsx` + `actions/reviews.ts`, star form on past completed appointments

### Phase 5 — Management + Reports

- [x] 18 Services Management + Gallery Upload — `app/admin/(main)/services/page.tsx`, `components/admin/ServicesManager.tsx`, `actions/services.ts`
- [x] 19 Staff Management — `app/admin/(main)/staff/page.tsx`, `components/admin/StaffManager.tsx`, `actions/staff.ts`
- [x] 20 Revenue Reports — `app/admin/(main)/reports/page.tsx`, daily bar chart + by-service/by-staff breakdown

### Phase 6 — Hermes Agent + Communication

- [ ] 21 Hermes Agent Core (Vercel Cron)
- [ ] 22 Multi-Channel Client Reminders (Telegram → WhatsApp → iMessage → Email)
- [ ] 23 Multi-Channel Marketing Campaigns
- [ ] 24 Telegram Owner Channel (Briefings + Alerts)
- [ ] 25 Re-engagement Outreach

### Phase 7 — Inventory + Payroll + Obsidian

- [x] 26 Inventory Management — `app/admin/(main)/inventory/page.tsx`, `components/admin/InventoryManager.tsx`, stock adjustment inline, low-stock filter
- [x] 27 Payroll Reports — `app/admin/(main)/payroll/page.tsx`, `components/admin/PayrollPanel.tsx`, commission calculation per period, save + mark paid
- [x] 28 Booth Rent Billing — `app/admin/(main)/staff/[id]/page.tsx`, `components/admin/BoothRentEditor.tsx`, upsert booth_renters + Stripe sub ID field
- [ ] 29 Obsidian Second Brain — DEFERRED (Hermes phase)
- [x] 30 Settings — `app/admin/(main)/settings/page.tsx`, `components/admin/SettingsForm.tsx`, salon info + hours + policy + Google Calendar ID

### Phase 8 — Memberships + Shop + Gift Cards + Crown Concierge

- [x] 31 Membership Management (Admin) — `app/admin/(main)/memberships/page.tsx`, `components/admin/MembershipsAdmin.tsx`, tier CRUD + subscriber list
- [x] 32 Client Membership Portal — `app/my-membership/page.tsx`, `components/client/MembershipPortal.tsx`, join + cancel
- [x] 33 Structured Intake Forms — `app/intake/[appointmentId]/page.tsx`, `components/client/IntakeFormClient.tsx`, `actions/intake.ts`, signed consent + hair profile
- [x] 34 Gift Cards — `app/gift-cards/page.tsx`, `app/admin/(main)/gift-cards/page.tsx`, purchase + admin issue + balance adjust
- [x] 35 Shop — `app/shop/page.tsx`, `app/admin/(main)/shop/page.tsx`, `components/admin/ShopAdmin.tsx`, product grid + admin CRUD
- [x] 36 Crown Concierge AI Chat — `app/api/ai/chat/route.ts` (claude-haiku-4-5), `app/concierge/page.tsx`, `components/client/CrownConcierge.tsx`

---

## Decisions Made During Build

- **Client auth:** Email/password + Google OAuth only (no Facebook/Apple — requires external developer accounts)
- **Hermes deferred:** Feature 09 (reminders + confirmation messages) built in a dedicated Hermes session
- **InsForge server auth:** Use `await insforge.auth.getCurrentUser()` — SSR client exposes async `getCurrentUser()`, not sync `getUser()`
- **Stripe SDK:** Installed v22.2.2; omit `apiVersion` to use library default

---

## Notes

- `proxy.ts` confirmed correct for Next.js 16 (see `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`)
- Migration trigger `system.update_updated_at()` was missing — added at top of migration file
- `/public/crowns-enchanted-TEMP/` deleted — was a full project duplicate sitting in the public folder
