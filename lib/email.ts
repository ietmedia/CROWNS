import { createInsforgeAdmin } from "@/lib/insforge-admin";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

type BookingEmailData = {
  to: string;
  clientName: string;
  serviceName: string;
  staffName: string | null;
  startTime: string;
  depositPaid: number;
  appointmentId: string;
  priceCents?: number;
};

export async function sendBookingConfirmation(data: BookingEmailData) {
  const insforge = createInsforgeAdmin();

  const start = new Date(data.startTime);
  const dateStr = start.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const timeStr = start.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
  const depositStr = new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
  }).format(data.depositPaid / 100);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Booking Confirmed — Crowns Enchanted</title>
</head>
<body style="margin:0;padding:0;background:#0a0808;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0808;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="text-align:center;padding-bottom:32px;">
            <p style="margin:0;font-size:28px;color:#c9a84c;letter-spacing:4px;text-transform:uppercase;">Crowns Enchanted</p>
            <p style="margin:8px 0 0;font-size:13px;color:#8a7a6a;letter-spacing:2px;text-transform:uppercase;">Luxury Natural Hair Care</p>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background:rgba(255,255,255,0.04);border:1px solid rgba(201,168,76,0.2);border-radius:16px;padding:40px 32px;">
            <p style="margin:0 0 8px;font-size:13px;color:#c9a84c;letter-spacing:3px;text-transform:uppercase;">Booking Confirmed</p>
            <h1 style="margin:0 0 32px;font-size:26px;color:#f5f0ea;font-weight:normal;">
              You're all set, ${escapeHtml(data.clientName)}
            </h1>

            <!-- Details -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
                  <p style="margin:0;font-size:11px;color:#8a7a6a;letter-spacing:2px;text-transform:uppercase;">Service</p>
                  <p style="margin:4px 0 0;font-size:16px;color:#f5f0ea;">${escapeHtml(data.serviceName)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
                  <p style="margin:0;font-size:11px;color:#8a7a6a;letter-spacing:2px;text-transform:uppercase;">Date &amp; Time</p>
                  <p style="margin:4px 0 0;font-size:16px;color:#f5f0ea;">${dateStr} at ${timeStr}</p>
                </td>
              </tr>
              ${data.staffName ? `
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
                  <p style="margin:0;font-size:11px;color:#8a7a6a;letter-spacing:2px;text-transform:uppercase;">Stylist</p>
                  <p style="margin:4px 0 0;font-size:16px;color:#f5f0ea;">${escapeHtml(data.staffName!)}</p>
                </td>
              </tr>` : ""}
              <tr>
                <td style="padding:12px 0;">
                  <p style="margin:0;font-size:11px;color:#8a7a6a;letter-spacing:2px;text-transform:uppercase;">Deposit Paid</p>
                  <p style="margin:4px 0 0;font-size:16px;color:#c9a84c;">${depositStr}</p>
                </td>
              </tr>
            </table>

            <!-- Address -->
            <div style="background:rgba(201,168,76,0.08);border-radius:10px;padding:16px 20px;margin-bottom:32px;">
              <p style="margin:0;font-size:12px;color:#8a7a6a;letter-spacing:2px;text-transform:uppercase;">Location</p>
              <p style="margin:6px 0 0;font-size:14px;color:#f5f0ea;">2900 Delk Road SE, Suite 17<br>Marietta, GA 30067</p>
            </div>

            <!-- Intake form CTA -->
            <div style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
              <p style="margin:0 0 6px;font-size:13px;color:#c9a84c;font-weight:bold;">📋 Complete Your Beauty Consultation</p>
              <p style="margin:0 0 14px;font-size:13px;color:#b0a090;line-height:1.5;">
                Help your stylist prepare for your visit by sharing your hair history, goals, and any health considerations.
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/intake/${data.appointmentId}"
                 style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#e8c96c);color:#1A1A2E;padding:10px 22px;border-radius:50px;font-size:13px;font-weight:600;text-decoration:none;">
                Fill Out Intake Form →
              </a>
            </div>

            <!-- My Appointments link -->
            <div style="text-align:center;margin-bottom:24px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-appointments"
                 style="color:#8a7a6a;font-size:13px;text-decoration:underline;">
                View My Appointments
              </a>
            </div>

            <!-- Policy note -->
            <p style="margin:0;font-size:12px;color:#8a7a6a;line-height:1.6;">
              Cancellations require 24 hours notice. A $50 no-show fee applies for missed appointments.
              To reschedule or cancel, visit your appointments page or call <a href="tel:4704958894" style="color:#c9a84c;">470-495-8894</a>.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="text-align:center;padding-top:32px;">
            <p style="margin:0;font-size:11px;color:#5a4a3a;">
              &copy; Crowns Enchanted &nbsp;·&nbsp; Marietta, GA &nbsp;·&nbsp;
              <a href="mailto:Info@crownsenchanted.com" style="color:#8a7a6a;">Info@crownsenchanted.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { error } = await insforge.emails.send({
    to: data.to,
    from: "Crowns Enchanted",
    replyTo: "ashleyharris977@gmail.com",
    subject: `✓ Confirmed: ${data.serviceName} on ${dateStr}`,
    html,
  });

  if (error) {
    console.error("[email] Booking confirmation failed:", error);
  }
}

export async function sendAdminBookingAlert(opts: {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  startTime: string;
}) {
  const insforge = createInsforgeAdmin();
  const start = new Date(opts.startTime);
  const dateStr = start.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "America/New_York",
  });
  const timeStr = start.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/New_York",
  });

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#1A1A2E;font-family:sans-serif">
  <div style="max-width:480px;margin:0 auto">
    <h2 style="color:#D4A017;font-family:Georgia,serif;margin:0 0 16px">New Booking 🎉</h2>
    <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(212,160,23,0.2);border-radius:12px;padding:20px">
      <p style="color:#C4B8DC;margin:0 0 8px"><strong style="color:#F2EEF8">Client:</strong> ${escapeHtml(opts.clientName)}</p>
      <p style="color:#C4B8DC;margin:0 0 8px"><strong style="color:#F2EEF8">Email:</strong> ${escapeHtml(opts.clientEmail)}</p>
      <p style="color:#C4B8DC;margin:0 0 8px"><strong style="color:#F2EEF8">Service:</strong> ${escapeHtml(opts.serviceName)}</p>
      <p style="color:#C4B8DC;margin:0"><strong style="color:#F2EEF8">When:</strong> ${dateStr} at ${timeStr}</p>
    </div>
    <p style="color:#6B5F8A;font-size:12px;margin-top:16px">Log in to admin to confirm or manage this booking.</p>
  </div>
</body></html>`;

  const { error } = await insforge.emails.send({
    to: "ashleyharris977@gmail.com",
    from: "Crowns Enchanted Admin",
    subject: `New Booking: ${opts.clientName} — ${opts.serviceName}`,
    html,
  });

  if (error) {
    console.error("[email] Admin booking alert failed:", error);
  }
}
