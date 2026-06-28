# UI Tokens

Design tokens for Crowns Enchanted. Deep purple + gold luxury salon aesthetic. All colors, typography, spacing, and component values extracted from the brand reference. Use these exact values throughout the codebase — never hardcode colors or use raw Tailwind color classes in components.

---

## How to Use

This project uses **Tailwind CSS v4**. All design tokens are defined using the `@theme` directive in `app/globals.css`. No `tailwind.config.ts` needed for colors or tokens.

Tailwind v4 automatically generates utility classes from `@theme` variables:

- `--color-accent` → `bg-accent`, `text-accent`, `border-accent`
- `--color-surface` → `bg-surface`, `text-surface`, `border-surface`
- `--color-gold` → `bg-gold`, `text-gold`, `border-gold`

```tsx
// Correct — uses generated utility classes
className="bg-background text-text-primary border-border"

// Also correct — references CSS variable directly
style={{ color: 'var(--color-gold)' }}

// Never — hardcoded hex values
className="bg-[#2D0A4E] text-[#D4A017]"

// Never — raw Tailwind color classes
className="bg-purple-900 text-yellow-600"
```

---

## globals.css — Complete Token Definition

```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600;700&display=swap');

@theme {
  /* Typography */
  --font-display: "Cormorant Garamond", serif;
  --font-sans: "Inter", sans-serif;

  /* Brand purple */
  --color-purple-deep:  #2D0A4E;
  --color-purple-royal: #4A0E8F;
  --color-purple-mid:   #7B2FBE;
  --color-purple-light: #A855F7;

  /* Brand gold */
  --color-gold:         #D4A017;
  --color-gold-light:   #F0C040;
  --color-gold-pale:    #FDF0B0;

  /* Supporting palette */
  --color-teal:         #0D9488;
  --color-teal-light:   #2DD4BF;
  --color-cream:        #FDF8F0;
  --color-cream-dark:   #F5ECD7;
  --color-charcoal:     #1A1A2E;

  /* Semantic tokens — page layout */
  --color-background:   #2D0A4E;
  --color-surface:      #1A1A2E;
  --color-surface-card: rgba(255, 255, 255, 0.05);
  --color-surface-elevated: rgba(255, 255, 255, 0.08);

  /* Borders */
  --color-border:       rgba(212, 160, 23, 0.2);
  --color-border-light: rgba(255, 255, 255, 0.1);
  --color-border-gold:  rgba(212, 160, 23, 0.5);

  /* Text */
  --color-text-primary:  #FDF8F0;
  --color-text-secondary: #E2C9A0;
  --color-text-muted:    #A855F7;
  --color-text-dark:     #2D0A4E;

  /* Accent (primary CTA = gold) */
  --color-accent:           #D4A017;
  --color-accent-dark:      #4A0E8F;
  --color-accent-light:     #FDF0B0;
  --color-accent-foreground: #1A1A2E;

  /* Status */
  --color-success:      #10B981;
  --color-success-light: #D0FAE5;
  --color-warning:      #F59E0B;
  --color-error:        #EF4444;
  --color-error-light:  #FEE2E2;
  --color-info:         #2DD4BF;

  /* Border radius */
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-2xl:  24px;
  --radius-full: 9999px;
}

/* Glassmorphism utility */
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-gold {
  background: rgba(212, 160, 23, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(212, 160, 23, 0.25);
}

/* Gradient text utility */
.text-gradient-gold {
  background: linear-gradient(135deg, #D4A017 0%, #F0C040 50%, #D4A017 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.text-gradient-purple {
  background: linear-gradient(135deg, #A855F7 0%, #7B2FBE 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Glow effects */
.glow-gold {
  box-shadow: 0 0 20px rgba(212, 160, 23, 0.3), 0 0 60px rgba(212, 160, 23, 0.1);
}

.glow-purple {
  box-shadow: 0 0 20px rgba(123, 47, 190, 0.4), 0 0 60px rgba(123, 47, 190, 0.15);
}

/* Animated gradient border */
@keyframes gradient-border {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.border-gradient-animated {
  background: linear-gradient(90deg, #D4A017, #A855F7, #0D9488, #D4A017);
  background-size: 300% 300%;
  animation: gradient-border 4s ease infinite;
  padding: 1px;
  border-radius: var(--radius-xl);
}
```

---

## Color Usage Guide

### Page Layout

| Element | Token | Value |
|---------|-------|-------|
| Page background | `bg-background` | Deep purple `#2D0A4E` |
| Card / surface | `bg-surface` | Dark charcoal `#1A1A2E` |
| Glassmorphism card | `.glass` class | `rgba(255,255,255,0.05)` |
| Gold glassmorphism | `.glass-gold` class | `rgba(212,160,23,0.08)` |
| Default border | `border-border` | Gold/20 |
| Light border | `border-border-light` | White/10 |

### Typography

| Element | Token | Value |
|---------|-------|-------|
| Primary text | `text-text-primary` | Cream `#FDF8F0` |
| Secondary text | `text-text-secondary` | Warm gold-cream `#E2C9A0` |
| Muted / accent | `text-text-muted` | Purple light `#A855F7` |
| Display headings | `font-display` + `text-gradient-gold` | Cormorant Garamond + gold gradient |

### Accent (CTA = Gold)

| Element | Token |
|---------|-------|
| Primary button background | `bg-accent` |
| Primary button text | `text-accent-foreground` |
| Hover/highlight | `bg-gold-light` |
| Subtle gold background | `bg-gold-pale` |

### Admin Panel

The admin panel uses the same dark luxury aesthetic. No light mode needed. Keep `bg-background` as the page bg and `.glass` cards throughout.

### Status Colors

| Status | Background | Text |
|--------|-----------|------|
| Confirmed | `bg-success-light` | `text-success` |
| Pending | `bg-gold-pale` | `text-text-dark` |
| Cancelled | `bg-error-light` | `text-error` |
| No Show | `bg-surface-elevated` | `text-text-muted` |
| Completed | `bg-teal-light/20` | `text-teal` |

---

## Typography

### Fonts

| Role | Font | Usage |
|------|------|-------|
| Display / headings | Cormorant Garamond | `font-[family-name:var(--font-display)]` |
| Body / UI | Inter | `font-[family-name:var(--font-sans)]` (default body) |

### Type Scale

| Element | Size | Weight | Font | Color token |
|---------|------|--------|------|-------------|
| Hero headline | 64–80px | 300–400 | Cormorant Garamond | `text-gradient-gold` |
| Section heading | 36–48px | 400 | Cormorant Garamond | `text-text-primary` |
| Card heading | 20–24px | 500–600 | Cormorant Garamond | `text-text-primary` |
| Stat number (admin) | 32px | 600 | Inter | `text-gold` |
| Nav items | 14px | 500 | Inter | `text-text-primary` |
| Body text | 14–16px | 400 | Inter | `text-text-secondary` |
| Labels / muted | 12px | 400 | Inter | `text-text-muted` |
| Button text | 14px | 500 | Inter | `text-accent-foreground` |

---

## Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `gap-2` | 8px | Badge gaps |
| `gap-4` | 16px | Form field gaps |
| `gap-6` | 24px | Card internal gaps |
| `gap-8` | 32px | Section gaps |
| `p-6` | 24px | Card padding |
| `p-8` | 32px | Large card / hero section padding |
| `px-6 py-3` | 24px / 12px | CTA button padding |
| `px-4 py-2` | 16px / 8px | Secondary button padding |

---

## Component Tokens

### Cards (Glassmorphism)

```
class: glass rounded-2xl p-6
background: rgba(255,255,255,0.05)
backdrop-filter: blur(12px)
border: 1px solid rgba(255,255,255,0.1)
border-radius: 24px (rounded-2xl)
padding: 24px (p-6)
```

For gold-accented cards (service cards, membership tiers):
```
class: glass-gold rounded-2xl p-6
```

### Buttons

**Primary (gold CTA):**
```
background: bg-accent (#D4A017)
text: text-accent-foreground (#1A1A2E)
border-radius: rounded-full
padding: px-6 py-3
font-size: 14px font-medium
hover: bg-gold-light glow-gold transition-all duration-300
```

**Secondary:**
```
background: transparent
border: 1px solid var(--color-border-gold)
text: text-gold
border-radius: rounded-full
padding: px-6 py-3
hover: glass-gold
```

**Ghost:**
```
background: transparent
text: text-text-secondary
hover: text-text-primary
```

### Input Fields

```
background: rgba(255,255,255,0.05)
border: 1px solid rgba(255,255,255,0.1)
border-radius: rounded-lg
padding: px-4 py-3
text: text-text-primary
placeholder: text-text-muted/60
focus: ring-1 ring-gold border-gold
```

### Badges

```
border-radius: rounded-full
padding: px-3 py-1
font-size: 12px
font-weight: 500
background: rgba(212,160,23,0.15)
color: text-gold
```

### Admin Sidebar

```
background: bg-surface (#1A1A2E)
border-right: 1px solid rgba(212,160,23,0.2)
width: 240px
Active nav item: text-gold, bg-gold/10, left border 2px solid #D4A017
Inactive nav item: text-text-secondary hover:text-text-primary
```

### Star Ratings

```
filled star: text-gold
empty star: text-border-light
size: 16px
```

---

## Invariants

- Never use hex values directly in components — always use CSS variables via Tailwind tokens
- Display font (Cormorant Garamond) for all headings — Inter for all body/UI text
- Never use raw Tailwind color classes like `bg-purple-900` or `text-yellow-600` — use project tokens only
- `--color-accent` (#D4A017 gold) is the primary CTA — all primary buttons use gold
- `--color-background` (#2D0A4E) is the page background — never white
- All cards use `.glass` or `.glass-gold` — never solid white or solid colored backgrounds
- Border default is `--color-border` (gold/20) — never `border-gray-*`
- `text-gradient-gold` for hero/display text — not solid gold text
- Admin panel uses same dark luxury aesthetic — no light admin theme
