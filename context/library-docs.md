# Library Docs

Project-specific usage patterns for every third-party library in this project. This file only covers how we use each library in Crowns Enchanted — rules, patterns, and constraints specific to this codebase.

Read the relevant section before implementing any feature that touches these libraries.

---

## Before Using Any Library

Before implementing any feature that uses a third-party library:

1. **Check AGENTS.md** — lists every skill installed and how to use them.
2. **Check if an MCP server is configured** for that library. Use it before falling back to general knowledge.
3. **Read this file** for project-specific patterns.

Order of authority:
```
MCP server (real-time docs) → Skills via AGENTS.md → This file (project rules) → General training knowledge
```

---

## InsForge

InsForge is the auth + database + storage backend (similar to Supabase). Uses `@insforge/ssr`.

### Two clients — never mix them

```typescript
// Browser (Client Components only)
import { insforge } from "@/lib/insforge-client";

// Server (Server Components, Route Handlers, Server Actions, agent/)
import { createInsforgeServer } from "@/lib/insforge-server";
const insforge = await createInsforgeServer();
```

### Query patterns

```typescript
// Always scope to current user in client-facing routes
const { data } = await insforge
  .from("appointments")
  .select("*, services(*), staff(*)")
  .eq("client_id", session.user.id)
  .order("start_time", { ascending: true });

// Admin routes — no user filter needed, RLS bypassed by service role
const { data } = await insforge
  .from("appointments")
  .select("*, clients(*), services(*), staff(*)")
  .gte("start_time", today)
  .order("start_time");
```

### Auth role check

```typescript
const { data: { session } } = await insforge.auth.getSession();
const role = session?.user?.user_metadata?.role; // 'client' | 'admin'
```

### Storage upload

```typescript
const { data, error } = await insforge.storage
  .from("services")
  .upload(`${serviceId}/${index}.jpg`, file, { contentType: "image/jpeg", upsert: true });

// Public URL
const { data: { publicUrl } } = insforge.storage
  .from("avatars")
  .getPublicUrl(`${staffId}.jpg`);
```

---

## Stripe

Handles deposits, membership subscriptions, booth rent subscriptions, no-show fees, and gift card purchases.

### Server-only — never use Stripe in Client Components

```typescript
// lib/stripe.ts
import Stripe from "stripe";
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});
```

### Deposit Checkout session

```typescript
// Create deposit Checkout
const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  mode: "payment",
  line_items: [{
    price_data: {
      currency: "usd",
      unit_amount: service.deposit_cents,
      product_data: { name: `${service.name} — Deposit` },
    },
    quantity: 1,
  }],
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/book/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/book`,
  metadata: { appointment_data: JSON.stringify(appointmentPayload) },
});
```

### Webhook — always verify signature

```typescript
// app/api/stripe/webhook/route.ts
const sig = req.headers.get("stripe-signature")!;
const body = await req.text();
const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);

switch (event.type) {
  case "checkout.session.completed":
    // insert appointment
    break;
  case "invoice.payment_succeeded":
    // update membership / booth rent status
    break;
}
```

### Off-session charge (no-show fee)

```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: settings.no_show_fee_cents,
  currency: "usd",
  customer: client.stripe_customer_id,
  payment_method: client.stripe_default_payment_method_id,
  off_session: true,
  confirm: true,
});
```

### Membership subscription

```typescript
const subscription = await stripe.subscriptions.create({
  customer: client.stripe_customer_id,
  items: [{ price: membership.stripe_price_id }],
  payment_behavior: "default_incomplete",
  expand: ["latest_invoice.payment_intent"],
});
```

---

## Resend

Handles all transactional emails: confirmations, cancellations, intake form links, gift card codes, digital product downloads, marketing campaign emails.

```typescript
// lib/resend.ts
import { Resend } from "resend";
export const resend = new Resend(process.env.RESEND_API_KEY!);
```

### Send email

```typescript
await resend.emails.send({
  from: `Crowns Enchanted <${process.env.RESEND_FROM_EMAIL}>`,
  to: client.email,
  subject: "Your appointment is confirmed ✨",
  html: `<p>Hi ${client.full_name},</p><p>...</p>`,
});
```

- Always use `RESEND_FROM_EMAIL` as the from address — never hardcode
- Emails are fire-and-forget for reminders; await them for critical flows (intake form link)
- Never put sensitive data (no-show fee amounts, admin notes) in emails

---

## Anthropic Claude

Powers Hermes agent message personalization and the Crown Concierge chat widget.

```typescript
// lib/anthropic.ts
import Anthropic from "@anthropic-ai/sdk";
export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
```

### Hermes personalized message

```typescript
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 300,
  messages: [{
    role: "user",
    content: `Write a warm appointment reminder for ${client.full_name}.
Service: ${service.name} with ${staff.name} on ${formattedDate}.
Intake notes: ${appointment.intake_notes || "none"}.
Keep it personal, warm, and under 150 words. Sign off as Crowns Enchanted.`,
  }],
});
const messageText = response.content[0].type === "text" ? response.content[0].text : "";
```

### Crown Concierge chat (streaming)

```typescript
// app/api/ai/chat/route.ts
const stream = await anthropic.messages.stream({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  system: CROWN_CONCIERGE_SYSTEM_PROMPT,
  messages: conversationHistory,
});

return new Response(stream.toReadableStream(), {
  headers: { "Content-Type": "text/event-stream" },
});
```

### Crown Concierge system prompt (stored in `lib/prompts.ts`)

```typescript
export const CROWN_CONCIERGE_SYSTEM_PROMPT = `
You are Ashley's AI hair consultant at Crowns Enchanted, a luxury holistic hair and wellness salon in Marietta, GA.

Your persona: warm, spiritual, knowledgeable. You combine ancestral hair wisdom with modern scalp science.
You never sound robotic or corporate — you speak like a trusted friend who happens to be a hair expert.

Services:
- Natural Hair Care: from $100 | Scalp Rehab: $399/$599 Deluxe | Reiki Infused: from $125
- Beauty Assessment: $150 | Editorial Styling: from $350 | Curl Rehab: $275/$350 Deluxe
- Hydrate + Protein Balance: $285 | Enchanted Cut Executive: $125

Memberships:
- Royal Beauty Society: $35/mo | Inner Glow: $150/mo | Content Creator: $250/mo (most popular)
- Influencer: $555/30 days | VIP Creator: $1,000/3 months

Hours: Tue–Sat by appointment. Closed Sun–Mon.
Location: 2900 Delk Road SE, Suite 17, Marietta, GA 30067
Phone: 470-495-8894 | Instagram: @crownsenchanted

When the client wants to book: always direct them to /book or call 470-495-8894.
You cannot book appointments yourself.
`;
```

- Use `claude-sonnet-4-6` — this is the model confirmed in use on the reference site
- Never use OpenAI in this project — Anthropic only
- Keep max_tokens low for Hermes messages (300) — high for chat (1024)

---

## Telegram Bot API

Used for: client outreach reminders + marketing (channel 1), owner real-time alerts, owner daily briefings.

```typescript
// lib/channels/telegram.ts
import TelegramBot from "node-telegram-bot-api";

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: false });

export async function sendTelegram(chatId: string, text: string): Promise<boolean> {
  try {
    await bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
    return true;
  } catch {
    return false;
  }
}
```

- `polling: false` — this is a server-side bot, not a polling client
- Always return boolean success — Hermes uses it to decide fallback
- Owner channel uses a different `chat_id` than client messages — stored in `settings`
- Client `telegram_chat_id` saved on `clients` row when they link their account

### Client Telegram onboarding flow

Client goes to `/my-profile` → clicks "Connect Telegram" → sees instructions:
1. Open Telegram, search for `@CrownsEnchantedBot`
2. Send `/start`
3. Bot responds with a unique 6-digit code
4. Client enters code in the profile form
5. Server validates code → saves `telegram_chat_id`

---

## WhatsApp Cloud API (Meta Graph API)

No Twilio. Direct calls to Meta Graph API.

```typescript
// lib/channels/whatsapp.ts
export async function sendWhatsApp(phone: string, text: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone, // E.164 format: +14705551234
          type: "text",
          text: { body: text },
        }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}
```

- `phone` must be E.164 format — validate before sending
- Return boolean so Hermes knows whether to fall through to next channel
- WhatsApp requires a Meta Business Account and approved phone number

---

## iMessage (AppleScript Bridge)

**⚠️ Vercel limitation:** iMessage via AppleScript only works on macOS. Vercel serverless = Linux. This channel only works if `IMESSAGE_BRIDGE_URL` is configured pointing to a local macOS machine running the bridge server.

```typescript
// lib/channels/imessage.ts
export async function sendIMessage(address: string, text: string): Promise<boolean> {
  const bridgeUrl = process.env.IMESSAGE_BRIDGE_URL;
  if (!bridgeUrl) return false;
  try {
    const res = await fetch(`${bridgeUrl}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: address, body: text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
```

The macOS bridge is a simple Express server running on Ashley's Mac Mini:
```typescript
// bridge/server.ts (runs on Mac Mini, not in this repo)
import { exec } from "child_process";
app.post("/send", (req, res) => {
  const { to, body } = req.body;
  const script = `tell application "Messages" to send "${body}" to buddy "${to}"`;
  exec(`osascript -e '${script}'`, (err) => {
    res.status(err ? 500 : 200).json({ ok: !err });
  });
});
```

---

## Obsidian Local REST API

Hermes writes Markdown notes to Ashley's Obsidian vault. Requires the [Obsidian Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) community plugin running on her Mac.

```typescript
// lib/obsidian.ts
export async function writeObsidianNote(path: string, content: string): Promise<void> {
  const url = process.env.OBSIDIAN_REST_URL;
  const key = process.env.OBSIDIAN_API_KEY;
  if (!url || !key) return; // silently skip if not configured

  // fire-and-forget — never block Hermes on Obsidian
  fetch(`${url}/vault/${encodeURIComponent(path)}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "text/markdown",
    },
    body: content,
  }).catch(() => {}); // swallow all errors silently
}
```

### Note templates

```typescript
// Client note — updated after each appointment
export function clientNoteContent(client: Client, history: Appointment[]): string {
  return `# ${client.full_name}
**Email:** ${client.email} | **Phone:** ${client.phone}
**Preferred Staff:** ${client.preferred_staff?.name ?? "Any"}
**Member Since:** ${formatDate(client.created_at)}

## Intake Summary
${intakeFormSummary(client.latest_intake)}

## Appointment History
${history.map(a => `- ${formatDate(a.start_time)}: ${a.service.name} with ${a.staff.name}`).join("\n")}

## Admin Notes
${client.admin_notes ?? "None"}
`;
}
```

---

## Google Calendar API

Syncs appointments to owner's Google Workspace calendar.

```typescript
// lib/google-calendar.ts
import { google } from "googleapis";

export function getCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth });
}

export async function createCalendarEvent(accessToken: string, appointment: Appointment) {
  const calendar = getCalendarClient(accessToken);
  const event = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: `${appointment.service.name} — ${appointment.client.full_name}`,
      description: appointment.intake_notes ?? "",
      start: { dateTime: appointment.start_time, timeZone: "America/New_York" },
      end: { dateTime: appointment.end_time, timeZone: "America/New_York" },
    },
  });
  return event.data.id;
}
```

- Access token stored per admin user in InsForge (refreshed via OAuth flow)
- Always use `America/New_York` timezone — salon is in Marietta, GA
- Store returned `event.id` in `google_calendar_sync` table for future updates/deletes

---

## PostHog

Analytics events and booking trend charts.

```typescript
// lib/posthog-client.ts — browser only
import posthog from "posthog-js";
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  capture_pageview: false,
});
export { posthog };

// lib/posthog-server.ts — server only
import { PostHog } from "posthog-node";
export const posthogServer = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
});
```

### The 6 events (only ever these 6)

```typescript
posthog.capture("appointment_booked", { userId, serviceId, staffId, hasDeposit });
posthog.capture("booking_cancelled", { userId, appointmentId, cancelledBy });
posthog.capture("profile_completed", { userId });
posthog.capture("service_viewed", { userId, serviceId, serviceName });
posthog.capture("hermes_message_sent", { channel, type }); // server-side
posthog.capture("campaign_sent", { campaignId, segment, recipientCount, channel }); // server-side
```

---

## Framer Motion

Animations for page sections, cards, and the Crown Concierge widget. All animations must feel graceful, never jarring.

```typescript
// Stagger children entrance (use on section containers)
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

<motion.div variants={container} initial="hidden" animate="show">
  {cards.map(card => (
    <motion.div key={card.id} variants={item}>...</motion.div>
  ))}
</motion.div>
```

- `"use client"` required on any component using Framer Motion
- Use `AnimatePresence` for components that mount/unmount (modal, chat widget)
- Keep durations under 500ms — luxury feels smooth, not slow
- Fade + translate (y: 20 → 0) is the default entrance. Never use bounce or elastic.
