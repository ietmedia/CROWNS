# UI Rules

Concise rules for building Crowns Enchanted UI. The reference site at `/public/crowns-enchanted-TEMP/` is the visual source of truth. These rules keep the UI consistent with the luxury spiritual salon brand without over-specifying every detail.

---

## Aesthetic Principle

This is a **luxury spiritual salon**, not a corporate SaaS. Every page must feel intimate, premium, and on-brand. Deep purple backgrounds, gold accents, glassmorphism cards, and elegant serif display text are the foundation — not optional.

---

## Fonts

Two fonts. Use them correctly.

```typescript
// app/layout.tsx
import { Cormorant_Garamond, Inter } from "next/font/google";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});
```

Apply both variables to `<html>`:
```tsx
<html className={`${cormorant.variable} ${inter.variable}`}>
```

**Cormorant Garamond** — all headings (`h1`–`h4`), hero text, section titles, service names, card headings.
Apply with: `font-[family-name:var(--font-display)]`

**Inter** — all body text, labels, nav items, buttons, form fields, table content, badges.
Apply with: `font-[family-name:var(--font-sans)]` (applied globally to `body`)

Never swap them. Never use system fonts.

---

## Layout

### Client Portal (public + logged-in client pages)

- Full-width pages with deep purple background (`bg-background`)
- Max-width container: `max-w-6xl mx-auto px-6`
- Top navbar: fixed, `h-16`, glassmorphism — `.glass border-b border-border`
- Sections separated by `py-16` or `py-24` for hero

### Admin Panel

- Two-column layout: sidebar (240px fixed) + main content area
- Sidebar: `bg-surface border-r border-border w-60 min-h-screen`
- Main content: `flex-1 bg-background p-8`
- Admin pages do NOT use the client navbar — separate admin layout

---

## Client Navbar

Five items: Logo, (nav links), Crown Concierge button, Profile avatar.

```
Logo:          "Crowns Enchanted" in Cormorant Garamond, text-gradient-gold
Nav links:     Book, My Appointments, Shop, Memberships
Active item:   text-gold font-medium
Inactive item: text-text-secondary hover:text-text-primary transition-colors
CTA button:    "Crown Concierge" — ghost button with gold border
Avatar:        Circular, 36px, links to /my-profile
```

All nav links: 14px, Inter, no underline, color change only on active.

If not logged in: show "Book Now" CTA + "Sign In" link instead of avatar.

---

## Admin Sidebar

Grouped navigation with section labels.

```
Section: Overview
  - Dashboard          /admin/dashboard
  - Calendar           /admin/calendar
  - Bookings           /admin/bookings

Section: Clients
  - Client List        /admin/clients
  - Campaigns          /admin/campaigns

Section: Operations
  - Services           /admin/services
  - Staff              /admin/staff
  - Inventory          /admin/inventory
  - Payroll            /admin/payroll

Section: Revenue
  - Reports            /admin/reports
  - Memberships        /admin/memberships
  - Gift Cards         /admin/gift-cards
  - Shop               /admin/shop

Section: System
  - Settings           /admin/settings
```

Active item: `text-gold bg-gold/10` + left border `border-l-2 border-gold`
Inactive item: `text-text-secondary hover:text-text-primary hover:bg-surface-elevated`
Section labels: `text-text-muted text-xs uppercase tracking-widest px-4 pt-4 pb-1`

---

## Cards

All content surfaces use glassmorphism.

```tsx
// Standard card
<div className="glass rounded-2xl p-6">

// Gold-accented card (services, memberships)
<div className="glass-gold rounded-2xl p-6">

// Elevated card (featured tier, hero overlay)
<div className="bg-surface-elevated rounded-2xl p-8 glow-gold">
```

Never use solid white or light backgrounds for cards — always glassmorphism on dark purple.

---

## Typography Hierarchy

**Hero / Page headline** — Cormorant Garamond, 64–80px, weight 300–400, `text-gradient-gold`
**Section heading** — Cormorant Garamond, 36–48px, weight 400, `text-text-primary`
**Card heading** — Cormorant Garamond, 20–24px, weight 500, `text-text-primary`
**Admin stat number** — Inter, 32px, weight 600, `text-gold`
**Body text** — Inter, 15–16px, weight 400, `text-text-secondary`
**Label / muted** — Inter, 12–13px, weight 400, `text-text-muted`
**Nav / button** — Inter, 14px, weight 500, varies

---

## Buttons

**Primary CTA (gold):**
```tsx
<button className="bg-accent text-accent-foreground rounded-full px-6 py-3 text-sm font-medium
  hover:bg-gold-light hover:glow-gold transition-all duration-300">
```

**Secondary (outlined gold):**
```tsx
<button className="border border-border-gold text-gold rounded-full px-6 py-3 text-sm font-medium
  hover:glass-gold transition-all duration-300">
```

**Ghost (nav action):**
```tsx
<button className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">
```

---

## Form Inputs

```tsx
<input className="w-full bg-surface-card border border-border-light rounded-lg px-4 py-3
  text-text-primary placeholder:text-text-muted/60 text-sm
  focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold
  transition-colors" />
```

Labels: `text-text-secondary text-sm font-medium mb-1.5`

---

## Tables (Admin)

```
Background: bg-surface
Header row: bg-surface-elevated, text-text-muted uppercase text-xs tracking-widest
Body rows: border-b border-border-light, hover:bg-surface-elevated
Cell text: text-text-primary text-sm
No alternating row colors
```

---

## Badges

```
border-radius: rounded-full
padding: px-3 py-1
font-size: 12px / text-xs
font-weight: 500
Default: bg-gold/15 text-gold
```

Status badge variants:
```
Confirmed:  bg-success/15  text-success
Pending:    bg-gold/15     text-gold
Cancelled:  bg-error/15    text-error
No Show:    bg-white/10    text-text-muted
Completed:  bg-teal/15     text-teal
```

---

## Animations

Use Framer Motion for all page/section entrance animations. Default pattern:

```tsx
// Fade up entrance for sections
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.4, ease: "easeOut" }}

// Staggered children (service cards, staff cards, etc.)
// Use variants — see library-docs.md for the container/item pattern
```

`AnimatePresence` for modal, Crown Concierge widget, and slide-out panels.

Duration: 300–500ms. Never exceed 600ms. Never use bounce or elastic easing.

---

## Empty States

Every list or table that can be empty must show an empty state:

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <Icon className="text-text-muted mb-4 h-10 w-10 opacity-40" />
  <p className="text-text-secondary text-sm">No appointments yet.</p>
  <Button variant="secondary" className="mt-4">Book your first visit</Button>
</div>
```

---

## Tailwind v4 Note

Tokens live in `@theme` in `app/globals.css` — never `tailwind.config.ts`. Glassmorphism, gradient text, and glow classes are defined as custom CSS utilities in globals.css — use them as regular class names.

---

## Do Nots

- Never use raw Tailwind color classes (`bg-purple-900`, `text-yellow-500`) — use project tokens only
- Never define colors in `tailwind.config.ts` — use `@theme` in globals.css
- Never use white or light-colored card backgrounds — always glassmorphism on dark
- Never put Cormorant Garamond on body text, nav, or form labels — Inter only
- Never use bounce or elastic animations
- Never use `position: fixed` for page layout elements — only for the Crown Concierge widget and modals
- Never expose raw error messages — always show user-friendly text
- Never use more than 2 nested rounded corners
- Never show both client navbar and admin sidebar — separate layouts
