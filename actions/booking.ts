"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createInsforgeServer } from "@/lib/insforge-server";
import { stripe } from "@/lib/stripe";
import { sendBookingConfirmation, sendAdminBookingAlert } from "@/lib/email";

interface BookingInput {
  serviceId: string;
  staffId: string | null;
  startTime: string;
  endTime: string;
  intakeNotes: string;
  depositCents: number;
  priceLabel: string;
  serviceName: string;
}

export async function createBooking(input: BookingInput) {
  const insforge = await createInsforgeServer();
  const { data: { user } } = await insforge.auth.getCurrentUser();

  if (!user) return { error: "You must be signed in to book." };

  const { data: apptData, error } = await insforge.database
    .from("appointments")
    .insert([{
      client_id: user.id,
      staff_id: input.staffId,
      service_id: input.serviceId,
      start_time: input.startTime,
      end_time: input.endTime,
      intake_notes: input.intakeNotes || null,
      status: "pending",
      payment_status: "none",
    }])
    .select("id")
    .single();

  if (error || !apptData) {
    return { error: "Failed to create booking. Please try again." };
  }

  // Send confirmation email (fire-and-forget — don't block redirect)
  const { data: clientRow } = await insforge.database
    .from("clients")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const clientName = (clientRow as { full_name: string } | null)?.full_name ?? "Guest";
  const clientEmail = (clientRow as { email: string } | null)?.email ?? user.email ?? "";

  void sendBookingConfirmation({
    to: clientEmail,
    clientName,
    serviceName: input.serviceName,
    staffName: null,
    startTime: input.startTime,
    depositPaid: 0,
    appointmentId: apptData.id,
    priceCents: input.priceLabel ? 0 : 0,
  });
  void sendAdminBookingAlert({
    clientName,
    clientEmail,
    serviceName: input.serviceName,
    startTime: input.startTime,
  });

  revalidatePath("/my-appointments");
  redirect("/my-appointments?booked=1");
}

export async function createCheckoutSession(input: BookingInput) {
  const insforge = await createInsforgeServer();
  const { data: { user } } = await insforge.auth.getCurrentUser();

  if (!user) return { error: "You must be signed in to book." };

  const { data: clientRow } = await insforge.database
    .from("clients")
    .select("stripe_customer_id, full_name, email")
    .eq("id", user.id)
    .single();

  const client = clientRow as {
    stripe_customer_id: string | null;
    full_name: string;
    email: string;
  } | null;

  const { data: apptData, error: apptError } = await insforge.database
    .from("appointments")
    .insert([
      {
        client_id: user.id,
        staff_id: input.staffId,
        service_id: input.serviceId,
        start_time: input.startTime,
        end_time: input.endTime,
        intake_notes: input.intakeNotes || null,
        status: "pending",
        payment_status: "none",
      },
    ])
    .select("id")
    .single();

  if (apptError || !apptData) {
    return { error: "Failed to reserve appointment slot. Please try again." };
  }

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer: client?.stripe_customer_id ?? undefined,
      customer_email: client?.stripe_customer_id
        ? undefined
        : (client?.email ?? user.email),
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: input.depositCents,
            product_data: {
              name: `Deposit — ${input.serviceName}`,
              description: `Appointment deposit. Remaining balance due at appointment.`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        client_id: user.id,
        service_id: input.serviceId,
        staff_id: input.staffId ?? "any",
        start_time: input.startTime,
        end_time: input.endTime,
        intake_notes: input.intakeNotes.slice(0, 500),
        appointment_id: apptData.id,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/my-appointments?booked=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/book`,
    });
  } catch (err) {
    console.error("[createCheckoutSession] Stripe error:", err);
    await insforge.database.from("appointments").delete().eq("id", apptData.id);
    return { error: "Failed to create checkout. Please try again." };
  }

  if (!session.url) {
    await insforge.database.from("appointments").delete().eq("id", apptData.id);
    return { error: "Failed to create checkout. Please try again." };
  }

  redirect(session.url);
}
