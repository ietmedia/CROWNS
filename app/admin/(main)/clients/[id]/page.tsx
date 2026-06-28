import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientProfile } from "@/actions/admin";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminNotesEditor from "@/components/admin/AdminNotesEditor";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  });
}

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  imessage: "iMessage",
};

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { client, appointments, reviews, intakeForm, error } = await getClientProfile(id);

  if (!client || error) notFound();

  const completedCount = appointments.filter((a) => a.status === "completed").length;
  const totalSpentCents = appointments
    .filter((a) => a.status === "completed")
    .reduce((sum, a) => sum + (a.services?.price_cents ?? 0), 0);
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="max-w-4xl">
      {/* Back */}
      <Link
        href="/admin/clients"
        className="text-text-muted text-sm hover:text-text-secondary transition-colors mb-6 inline-block"
      >
        ← Back to Clients
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl text-text-primary mb-1">
            {client.full_name || "—"}
          </h1>
          <p className="text-text-secondary text-sm">
            Client since {fmtDate(client.created_at)}
          </p>
        </div>
        {avgRating && (
          <div className="glass rounded-xl px-4 py-3 text-center">
            <p className="text-gold text-2xl font-display">{avgRating}</p>
            <p className="text-text-muted text-xs">avg rating</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-gold text-2xl font-display">{appointments.length}</p>
          <p className="text-text-muted text-xs mt-1">Total Visits</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-gold text-2xl font-display">{completedCount}</p>
          <p className="text-text-muted text-xs mt-1">Completed</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-gold text-2xl font-display">{fmt(totalSpentCents)}</p>
          <p className="text-text-muted text-xs mt-1">Total Spent</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Contact info */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-text-primary font-medium text-sm uppercase tracking-widest mb-4">
            Contact
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-text-muted text-xs">Email</dt>
              <dd className="text-text-primary mt-0.5">{client.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-text-muted text-xs">Phone</dt>
              <dd className="text-text-primary mt-0.5">{client.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-text-muted text-xs">Preferred Channel</dt>
              <dd className="text-text-primary mt-0.5">
                {CHANNEL_LABELS[client.preferred_channel] ?? client.preferred_channel}
              </dd>
            </div>
            {client.staff && (
              <div>
                <dt className="text-text-muted text-xs">Preferred Staff</dt>
                <dd className="text-text-primary mt-0.5">{client.staff.name}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Admin notes */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-text-primary font-medium text-sm uppercase tracking-widest mb-4">
            Admin Notes
          </h2>
          <AdminNotesEditor clientId={client.id} initialNotes={client.admin_notes} />
        </div>
      </div>

      {/* Hair Profile / Intake Form */}
      {intakeForm && (
        <div className="glass rounded-xl overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-text-primary font-medium text-sm uppercase tracking-widest">
              Hair Profile
            </h2>
            <div className="text-right">
              {intakeForm.signed_at ? (
                <span className="text-success text-xs">
                  ✓ Signed {fmtDate(intakeForm.signed_at)}
                </span>
              ) : (
                <span className="text-text-muted text-xs">Unsigned</span>
              )}
              {intakeForm.appointments && (
                <p className="text-text-muted text-xs mt-0.5">
                  From {fmtDate(intakeForm.appointments.start_time)} — {intakeForm.appointments.services?.name ?? "Appointment"}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-border">
            {[
              { label: "Hair Type", value: intakeForm.hair_type },
              { label: "Density", value: intakeForm.hair_density },
              { label: "Texture", value: intakeForm.hair_texture },
              { label: "Concerns", value: intakeForm.concerns },
              { label: "Goals", value: intakeForm.goals },
              { label: "Last Chemical Service", value: intakeForm.last_chemical_service },
              { label: "Current Products", value: intakeForm.current_products },
              { label: "Health Conditions", value: intakeForm.health_conditions },
              { label: "Allergies", value: intakeForm.allergies },
            ]
              .filter((row) => row.value)
              .map((row) => (
                <div key={row.label} className="px-5 py-4">
                  <dt className="text-text-muted text-xs uppercase tracking-widest mb-1">{row.label}</dt>
                  <dd className="text-text-primary text-sm leading-relaxed">{row.value}</dd>
                </div>
              ))}
          </div>
          {!intakeForm.hair_type && !intakeForm.concerns && !intakeForm.goals && (
            <p className="text-text-muted text-sm px-6 py-6 text-center">
              Intake form submitted but no hair details entered yet.
            </p>
          )}
        </div>
      )}

      {!intakeForm && (
        <div className="glass rounded-xl p-6 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
            <span className="text-gold text-lg">📋</span>
          </div>
          <div>
            <p className="text-text-primary text-sm font-medium">No intake form on file</p>
            <p className="text-text-muted text-xs mt-0.5">
              Client has not completed a beauty consultation intake form yet.
            </p>
          </div>
        </div>
      )}

      {/* Appointment history */}
      <div className="glass rounded-xl overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-text-primary font-medium text-sm uppercase tracking-widest">
            Appointment History
          </h2>
        </div>
        {appointments.length === 0 ? (
          <p className="text-text-muted text-sm px-6 py-8 text-center">No appointments yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Date & Time", "Service", "Staff", "Price", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-text-muted text-xs uppercase tracking-widest font-normal"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {appointments.map((appt) => (
                <tr key={appt.id} className="hover:bg-surface-elevated transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-text-secondary">
                    {fmtDateTime(appt.start_time)}
                  </td>
                  <td className="px-4 py-3 text-text-primary">
                    {appt.services?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {appt.staff?.name ?? "Any"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                    {appt.services ? fmt(appt.services.price_cents) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={appt.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="glass rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-text-primary font-medium text-sm uppercase tracking-widest">
              Reviews Left
            </h2>
          </div>
          <div className="divide-y divide-border">
            {reviews.map((review) => (
              <div key={review.id} className="px-6 py-4">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-gold text-sm">
                    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                  </span>
                  <span className="text-text-muted text-xs">{review.services?.name}</span>
                  <span className="text-text-muted text-xs ml-auto">
                    {fmtDate(review.created_at)}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-text-secondary text-sm">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
