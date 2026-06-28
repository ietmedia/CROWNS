# Code Standards

Implementation rules and conventions for Crowns Enchanted. The AI agent must follow these in every session without exception. These rules prevent pattern drift across sessions.

---

## Engineering Mindset

The AI agent on this project operates as a senior engineer. This means:

- **Think before implementing** — understand what is being built and why before writing a single line
- **Read context files first** — always verify against architecture.md, build-plan.md, and project-overview.md
- **Scope is sacred** — only build what the current feature requires. Never go beyond scope
- **Every feature must be testable** — if it cannot be verified immediately after implementation, it is incomplete
- **Clean over clever** — simple readable code a junior developer can understand beats clever abstractions
- **One thing at a time** — complete one feature fully before touching the next
- **Failures are expected** — wrap agent operations in try/catch, log failures, never let one crash everything

---

## TypeScript

- Strict mode enabled in tsconfig.json — no exceptions
- Never use `any` — use `unknown` and narrow the type
- Never use type assertions (`as SomeType`) unless absolutely necessary and commented why
- All function parameters and return types must be explicitly typed
- Use `type` for object shapes and unions — use `interface` only for extendable component props
- All async functions must have proper error handling — never let promises float unhandled
- Use `const` by default — only use `let` when reassignment is necessary

---

## Next.js 16 Conventions

- App Router only — no Pages Router
- React 19 — use React 19 APIs throughout
- All components are Server Components by default
- Only add `"use client"` when the component requires:
  - useState or useReducer
  - useEffect
  - Browser APIs / event listeners
  - Framer Motion animations
  - PostHog browser side tracking
  - Crown Concierge chat (streaming)
- Never add `"use client"` to layout files unless absolutely required
- Data fetching happens in Server Components — never fetch in Client Components directly
- Route handlers live in `app/api/` — never put business logic directly in route handlers
- Server Actions live in `actions/` — never define Server Actions inline in components
- Caching is uncached by default — all dynamic code runs at request time
- **Always read `node_modules/next/dist/docs/` before implementing any Next.js-specific feature** — APIs in this version may differ from training data

---

## File and Folder Naming

- Folders: kebab-case — `my-appointments`, `admin-calendar`
- Component files: PascalCase — `BookingCard.tsx`, `ServiceGallery.tsx`
- Utility / lib files: camelCase — `insforge-client.ts`, `posthog-client.ts`
- Channel files: camelCase in `lib/channels/` — `telegram.ts`, `whatsapp.ts`, `imessage.ts`, `email.ts`
- Type files: camelCase — `index.ts`
- API route files: always `route.ts`
- Server Action files: camelCase — `booking.ts`, `profile.ts`
- One component per file — never export multiple components from one file
- Index files only in `components/ui/` — never barrel export from other folders

---

## Component Structure

Every component follows this exact order:

```typescript
"use client"; // only if needed

// 1. External imports
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

// 2. Internal imports
import { ServiceCard } from "@/components/booking/ServiceCard";

// 3. Type definitions
type Props = {
  serviceId: string;
  price: number;
};

// 4. Component
export function ComponentName({ serviceId, price }: Props) {
  // state
  // derived values
  // handlers
  // return JSX
}
```

- Never use default exports for components — always named exports
- Props type defined directly above the component — not in a separate types file unless shared
- No inline styles — all styling via Tailwind classes using CSS variables from ui-tokens.md

---

## API Route Handlers

```typescript
// app/api/bookings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createInsforgeServer } from "@/lib/insforge-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // validate body
    // call service function
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[api/bookings]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- Every route handler has a try/catch
- Every route handler validates the request body before processing
- Errors are logged with the route path as prefix: `[api/bookings]`
- Always return `{ success: boolean, data?: T, error?: string }`
- Never return raw data without the success wrapper

---

## Server Actions

```typescript
// actions/booking.ts

"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeServer } from "@/lib/insforge-server";

export async function cancelAppointment(appointmentId: string) {
  try {
    const insforge = await createInsforgeServer();
    // validate ownership
    // update status
    revalidatePath("/my-appointments");
    return { success: true };
  } catch (error) {
    console.error("[actions/booking/cancel]", error);
    return { success: false, error: "Failed to cancel appointment" };
  }
}
```

- Every Server Action has a try/catch
- Every Server Action returns `{ success: boolean, error?: string }`
- Always call `revalidatePath` after mutations that affect page data
- Never throw from Server Actions — always return the error

---

## Agent Code (Hermes)

```typescript
// agent/hermes.ts

export async function runHermesReminders(): Promise<{ success: boolean; sent: number; error?: string }> {
  try {
    // fetch upcoming appointments within reminder window
    // for each: generate Claude message, send via best available channel
    return { success: true, sent: count };
  } catch (error) {
    console.error("[hermes/reminders]", error);
    return { success: false, sent: 0, error: String(error) };
  }
}
```

- Every agent function returns `{ success: boolean, error?: string }`
- Every agent function has a try/catch — never let one failure crash the run
- Agent functions **never** import from `components/` or `actions/`
- Agent functions never use React hooks or browser APIs
- Hermes channel failures are non-fatal — log and continue to next client

---

## InsForge Client Usage

```typescript
// Browser context — Client Components only
import { insforge } from "@/lib/insforge-client";

// Server context — Server Components, Route Handlers, Server Actions, Agent
import { createInsforgeServer } from "@/lib/insforge-server";
const insforge = await createInsforgeServer();
```

- Never use the browser client in server context
- Never use the server client in browser context
- Always await `createInsforgeServer()` — it reads cookies asynchronously
- Client-facing queries: always filter by current user_id (RLS enforces, but be explicit)
- Admin queries: no user filter needed — admin role bypasses RLS for their panel

---

## Error Handling

- Never use empty catch blocks — always log or handle
- Console errors always include context prefix: `[component/function-name]`
- User-facing errors must be human readable — never expose raw error messages
- Agent errors logged to console with `[hermes/*]` prefix — never surface raw agent errors to UI
- API route errors return `status: 500` with generic message — never expose internals
- Hermes channel failures: `return false` (silent) — never throw

---

## PostHog Events

All PostHog events must use these exact event names. Never invent new event names without adding them here first.

| Event | When | Key Properties |
|-------|------|----------------|
| `appointment_booked` | Client completes booking (deposit paid or direct insert) | `userId`, `serviceId`, `staffId`, `hasDeposit` |
| `booking_cancelled` | Client or admin cancels an appointment | `userId`, `appointmentId`, `cancelledBy` |
| `profile_completed` | Client saves complete profile for the first time | `userId` |
| `service_viewed` | Client taps a service card in the booking flow | `userId`, `serviceId`, `serviceName` |
| `hermes_message_sent` | Hermes successfully sends via any channel | `channel` (telegram/whatsapp/imessage/email), `type` (reminder/marketing/reengagement) |
| `campaign_sent` | Admin-approved campaign fully executes | `campaignId`, `segment`, `recipientCount`, `channel` |

These are the **only 6 events**. Do not add more without updating this list first.

`appointment_booked` powers the Bookings Over Time chart in reports.
Always fire with correct properties — wrong properties break report charts.

---

## Environment Variables

All environment variables defined in `.env.local` for development. Never hardcode any key, URL, or secret.

| Variable | Used In |
|----------|---------|
| `NEXT_PUBLIC_INSFORGE_URL` | lib/insforge-client.ts |
| `NEXT_PUBLIC_INSFORGE_ANON_KEY` | lib/insforge-client.ts |
| `STRIPE_SECRET_KEY` | lib/stripe.ts |
| `STRIPE_WEBHOOK_SECRET` | app/api/stripe/webhook/route.ts |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | client-side Stripe.js |
| `RESEND_API_KEY` | lib/resend.ts |
| `RESEND_FROM_EMAIL` | lib/resend.ts |
| `ANTHROPIC_API_KEY` | agent/hermes.ts, app/api/ai/chat/route.ts |
| `TELEGRAM_BOT_TOKEN` | lib/channels/telegram.ts |
| `TELEGRAM_CHAT_ID` | lib/channels/telegram.ts (owner channel) |
| `WHATSAPP_PHONE_ID` | lib/channels/whatsapp.ts |
| `WHATSAPP_TOKEN` | lib/channels/whatsapp.ts |
| `IMESSAGE_BRIDGE_URL` | lib/channels/imessage.ts (optional) |
| `OBSIDIAN_REST_URL` | lib/obsidian.ts (optional) |
| `OBSIDIAN_API_KEY` | lib/obsidian.ts (optional) |
| `GOOGLE_CLIENT_ID` | lib/google-calendar.ts |
| `GOOGLE_CLIENT_SECRET` | lib/google-calendar.ts |
| `GOOGLE_REDIRECT_URI` | lib/google-calendar.ts |
| `NEXT_PUBLIC_POSTHOG_KEY` | lib/posthog-client.ts |
| `NEXT_PUBLIC_POSTHOG_HOST` | lib/posthog-client.ts |
| `NEXT_PUBLIC_APP_URL` | Stripe redirect URLs, email links |
| `NEXT_PUBLIC_BUSINESS_NAME` | "Crowns Enchanted" |

`NEXT_PUBLIC_` prefix = exposed to browser. Never add `NEXT_PUBLIC_` to any secret key.

---

## Import Aliases

Always use the `@/` alias — never use relative imports that go up more than one level.

```typescript
// Correct
import { Button } from "@/components/ui/button";
import { insforge } from "@/lib/insforge-client";
import { sendTelegram } from "@/lib/channels/telegram";

// Never
import { Button } from "../../../components/ui/button";
```

---

## Comments

- No comments explaining what the code does — code must be self-explanatory
- Comments only for why — explaining a non-obvious decision or constraint
- Hermes channel functions may have a brief comment on fallback behavior
- Never leave TODO comments in committed code

---

## Dependencies

Never install a new package without a clear reason. Before installing, check:

1. Does shadcn/ui already have this component?
2. Does Next.js already provide this functionality?
3. Is there a simpler native solution (e.g., `fetch` instead of `axios`)?

**Approved dependencies for this project:**

- `@insforge/ssr` — InsForge auth + DB + storage
- `stripe` — payments (deposits, subscriptions, no-show charges)
- `resend` — transactional emails
- `@anthropic-ai/sdk` — Claude for Hermes + Crown Concierge
- `node-telegram-bot-api` — Telegram client channel + owner alerts
- `googleapis` — Google Calendar sync
- `framer-motion` — animations
- `posthog-js` — PostHog browser client
- `posthog-node` — PostHog server client
- `zod` — schema validation
- `lucide-react` — icons
- `tailwindcss` — styling
- `shadcn/ui` components — UI primitives
- `recharts` — revenue/booking charts (Phase 5)

Do not install any other packages without updating this list first.
