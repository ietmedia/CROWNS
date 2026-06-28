import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createInsforgeAdmin } from "@/lib/insforge-admin";
import { sendBookingConfirmation } from "@/lib/email";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Use admin client — webhook runs outside user session
  const insforge = createInsforgeAdmin();

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const meta = session.metadata ?? {};

      const { data: updated, error } = await insforge.database
        .from("appointments")
        .update({
          status: "confirmed",
          payment_status: "deposit_paid",
          stripe_session_id: session.id,
        })
        .eq("id", meta.appointment_id)
        .eq("payment_status", "none") // idempotency guard — skip if already processed
        .select("id");

      if (error) {
        console.error("[stripe/webhook] Failed to update appointment:", error);
        return NextResponse.json({ error: "DB update failed" }, { status: 500 });
      }

      // 0 rows updated = webhook already processed (Stripe retry) — ack without re-sending email
      if (!updated?.length) {
        return NextResponse.json({ received: true });
      }

      // Save stripe_customer_id to clients table if present
      if (session.customer && meta.client_id) {
        await insforge.database
          .from("clients")
          .update({ stripe_customer_id: session.customer as string })
          .eq("id", meta.client_id);
      }

      // Send confirmation email — fire and forget; don't block webhook response
      if (meta.client_id) {
        const [clientRes, serviceRes, staffRes] = await Promise.all([
          insforge.database
            .from("clients")
            .select("email, full_name")
            .eq("id", meta.client_id)
            .single(),
          insforge.database
            .from("services")
            .select("name")
            .eq("id", meta.service_id)
            .single(),
          meta.staff_id && meta.staff_id !== "any"
            ? insforge.database
                .from("staff")
                .select("name")
                .eq("id", meta.staff_id)
                .single()
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (clientRes.data?.email) {
          const client = clientRes.data as { email: string; full_name: string };
          const service = serviceRes.data as { name: string } | null;
          const staff = staffRes.data as { name: string } | null;

          void sendBookingConfirmation({
            to: client.email,
            clientName: client.full_name,
            serviceName: service?.name ?? "Appointment",
            staffName: staff?.name ?? null,
            startTime: meta.start_time,
            depositPaid: session.amount_total ?? 0,
            appointmentId: meta.appointment_id ?? "",
          });
        }
      }
    }

    if (event.type === "invoice.payment_succeeded") {
      // Membership and booth rent renewals — handled in Phase 8 / Phase 7
    }
  } catch (err) {
    console.error("[stripe/webhook] Handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
