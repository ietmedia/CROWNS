# Vagaro vs. Crowns Enchanted — Competitive Analysis

_Public-side research, 2026-09-05. Merchant/admin UI teardown pending your screen captures._
_Screenshots: `competitor-research/vagaro-shots/`_

---

## 1. What Vagaro is

A mature, broad salon/spa/fitness platform (~$430M revenue scale, 24/7 support, 1877 businesses listed in Marietta alone). It is a **marketplace + SaaS** — every business is a listing on `vagaro.com`, and clients book through Vagaro's directory and apps. Feature breadth is its moat; polish and performance are its weak points.

---

## 2. Vagaro's feature set (public sources)

| Area | Vagaro |
|---|---|
| **Calendar** | Day / week / month / team views, drag-and-drop reschedule, hover-for-detail, colour-coded appointments, **resource management**, prevents double-booking |
| **Online booking** | Vagaro Marketplace, Vagaro app, embeddable widget, Instagram / Facebook / Yelp / Google / Apple Maps |
| **Recurring appointments** | Yes (mobile app) |
| **Waitlist** | Yes (desktop + mobile) |
| **POS / checkout** | From calendar or top nav; "Pay Desk" dual-screen (client + staff) — **hardware sold separately**; card reader free with merchant services |
| **Payments** | Add-on; "rates as low as 2.2%"; PayPro terminals, card readers, receipt printers |
| **Cards on file / no-show protection** | Store card, charge deposit, charge on late-cancel / no-show |
| **Cancellation policy** | Configurable notice window (e.g. one salon: "42 hour notice… we will take a deposit for future appointments") |
| **Memberships** | Auto-recurring billing, custom service bundles + discounts |
| **Packages** | Pre-paid service bundles |
| **Gift certificates** | Yes |
| **Client database** | Multiple notes per client, upload PDFs/images, **SOAP/advanced intake forms** |
| **Forms & waivers** | **$10/mo add-on**; client e-signature |
| **Marketing** | 1,000 free marketing emails/mo; **text marketing = paid add-on**; automated reminders (unlimited); loyalty programs; Marketplace "daily deals" |
| **Inventory** | Included; real-time stock tracking |
| **Payroll** | Commission down to service/product level; flat-rate or % ; booth/chair **rent collection** for multi-chair |
| **Reporting** | "Advanced reporting" — but **preset dashboards only, limited customisation** |
| **Website** | MySite branded booking site builder (SEO, portfolio) |
| **Branded app** | Paid add-on |
| **Support / onboarding** | 24/7 phone/email/chat, free training, free data migration |

**Pricing:** $23.99/mo base + **$10 per bookable calendar** (per staff) up to 7; 7+ = $83.99/mo. Forms +$10/mo, text marketing extra, branded app extra, payment processing extra, Pay Desk hardware extra. Reviewer consensus: _"they upcharge for everything."_

---

## 3. Vagaro's weaknesses (verified from reviews + our own walkthrough)

1. **Forced client accounts.** Clicking "Book Now" on a business page immediately throws a **Vagaro login/signup wall** (screenshot `05-booking-step2.png`) — Facebook / Google / Apple / Vagaro account required before you can pick a service. Widely cited client complaint.
2. **Your clients become Vagaro's clients.** They get marketed to by Vagaro and shown competitors in the same Marketplace directory (`03-marketplace-listings.png` — 1877 competing businesses).
3. **Performance.** "Slow… screens take time to load," front-desk line-ups, "crashed multiple times, especially when creating new appointments and changing pricing or service times."
4. **Generic UI.** Utilitarian white/red directory chrome (`01-business-landing.png`). Booking-widget branding is **"limited to colour changes"** — no real design control.
5. **Nickel-and-diming.** Base plan is thin; the useful pieces (forms, text marketing, branded app, processing, hardware) are all paid add-ons that stack per calendar.
6. **Reporting is rigid** — preset dashboards, little custom analysis.
7. **Learning curve** — "a lot of features," setup is heavy.

---

## 4. Feature parity map — Crowns Enchanted vs. Vagaro

### Already at parity (built)
- Service browsing, staff picker, date/time picker, booking confirmation
- Stripe **deposit** at booking
- No-show protection (card charge) — `chargeNoShow` in `actions/admin.ts`
- Client "My Appointments" + self-cancel with policy window
- Admin: dashboard KPIs, bookings table + inline status, week calendar with click-to-book, walk-in/guest booking, client CRM + profiles + notes, services, staff, **inventory**, **payroll with commission + booth rent**, **reports** (revenue by service/staff, daily chart), **memberships**, **gift cards**, retail **shop**, campaigns, settings
- **Intake forms** (hair history, goals, health, e-signature) — Vagaro charges $10/mo for this
- Reviews / ratings

### Vagaro has it, you don't yet
| Gap | Priority for a single-location luxury salon |
|---|---|
| **Recurring / repeat appointments** | Medium — regulars rebooking every 6–8 wks is core salon behaviour |
| **Waitlist** when fully booked | Medium — captures revenue on cancellations |
| **Automated reminders** (text/email, X hrs before) | **High** — biggest no-show reducer; you have the plumbing (Resend + reminder_hours_before in settings) but the Hermes reminder job is deferred |
| **Pre-paid packages** (distinct from memberships) | Low–Medium |
| **Resource management** (rooms/equipment, not just staff) | Low for now |
| **In-person POS / card-present checkout + hardware** | Low unless you want to replace the front-desk terminal |
| **Loyalty program** (points) | Low |
| **Embeddable widget / Instagram / Google booking** | Medium — where luxury clients actually discover you |
| **Google/Apple/Facebook social login for clients** | Low — Clerk already does Google |

### You have it, Vagaro doesn't (your wedge)
- **Guest-first booking, no marketplace account** — Clerk sign-in only, no "become Vagaro's customer" wall. This is a real conversion advantage.
- **You own the client relationship** — no third party marketing to your list, no competitor promoted alongside you.
- **Bespoke luxury design** — deep-purple/gold, Cormorant Garamond, Framer Motion. Vagaro can't touch this; their branding stops at "change the accent colour."
- **AI: Crown Concierge** (client-facing hair advice + booking guidance) and **Hermes** (owner agent: reminders, re-engagement, briefings).
- **Multi-channel outreach** — Telegram / WhatsApp / iMessage / email with per-client priority, vs. Vagaro's email + paid SMS.
- **Obsidian second-brain** — Hermes writes client notes / treatment records into the owner's vault.
- **Custom reporting** — you control the queries; Vagaro users are stuck with preset dashboards.
- **Flat cost** — your Stripe/Supabase/Clerk/Resend stack is ~usage-priced; Vagaro is $23.99 + $10/stylist + add-ons forever.

---

## 5. Recommendations

**Close these three gaps next (highest ROI, all leverage existing infra):**
1. **Automated appointment reminders** — wire the deferred Hermes reminder job to `settings.reminder_hours_before` + Resend/Telegram. Directly attacks no-shows, which is the #1 thing salons buy software to fix.
2. **Recurring / "rebook same time in N weeks"** — a single field on the appointment + a cron. Keeps regulars in your system instead of texting the owner.
3. **Waitlist** — "notify me if a slot opens" on a fully-booked day; fills cancellations automatically.

**Lean into the wedge in marketing copy:** "Book in 30 seconds — no account, no app to download, no marketplace." That's a direct shot at Vagaro's biggest friction point.

**Don't chase:** in-person POS hardware, loyalty points, resource/room management, a public directory. Those are Vagaro's multi-location enterprise plays; they're weight, not value, for one luxury studio.

---

## 6. Still needed from you — merchant/admin UI teardown

The above is the **public / client-facing** side. For the admin comparison (which is what your `/admin` panel competes with), capture these Vagaro screens (screenshots, screen-recording, or DevTools HAR) and drop them in `competitor-research/`:

- Calendar — day & week, the drag-to-book interaction, any resource/room lane
- Checkout / Pay Desk flow (service → tip → payment → receipt)
- Client profile — history, cards on file, notes, attached forms, membership status
- Membership **setup** screen and Package setup screen
- Online booking **settings** (deposit rules, cancellation window, lead time, buffer)
- Reports — which ones exist, what's filterable
- Forms builder
- Payroll / commission setup
- Inventory screen

I'll turn those into a screen-by-screen comparison with your admin.
