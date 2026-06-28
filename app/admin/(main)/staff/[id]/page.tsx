import Link from "next/link";
import { notFound } from "next/navigation";
import { getStaffDetail } from "@/actions/booth";
import StatusBadge from "@/components/admin/StatusBadge";
import BoothRentEditor from "@/components/admin/BoothRentEditor";

const ROLE_LABELS: Record<string, string> = {
  stylist: "Stylist",
  colorist: "Colorist",
  nail_tech: "Nail Tech",
  esthetician: "Esthetician",
  other: "Other",
};

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
    timeZone: "America/New_York",
  });
}

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { staff, appointments, payroll, booth } = await getStaffDetail(id);

  if (!staff) notFound();

  const completedAppts = appointments.filter((a) => a.status === "completed");
  const totalRevenueCents = completedAppts.reduce((s, a) => s + (a.services?.price_cents ?? 0), 0);

  return (
    <div className="max-w-4xl">
      <Link
        href="/admin/staff"
        className="text-text-muted text-sm hover:text-text-secondary transition-colors mb-6 inline-block"
      >
        ← Back to Staff
      </Link>

      {/* Header */}
      <div className="flex items-start gap-5 mb-8">
        {staff.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={staff.avatar_url}
            alt={staff.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-border-light shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-surface-elevated border-2 border-border-light shrink-0 flex items-center justify-center">
            <span className="text-text-muted text-3xl font-display">
              {staff.name[0]?.toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <h1 className="font-display text-4xl text-text-primary mb-1">{staff.name}</h1>
          <div className="flex items-center gap-2">
            <span className="text-text-muted text-sm">
              {ROLE_LABELS[staff.role] ?? staff.role}
            </span>
            {!staff.is_active && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-error/15 text-error">
                Inactive
              </span>
            )}
          </div>
          {staff.bio && (
            <p className="text-text-secondary text-sm mt-2 max-w-md">{staff.bio}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-gold text-2xl font-display">{completedAppts.length}</p>
          <p className="text-text-muted text-xs mt-1">Completed</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-gold text-2xl font-display">{fmt(totalRevenueCents)}</p>
          <p className="text-text-muted text-xs mt-1">Revenue Generated</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-gold text-2xl font-display">
            {Math.round(Number(staff.commission_rate) * 100)}%
          </p>
          <p className="text-text-muted text-xs mt-1">Commission Rate</p>
        </div>
      </div>

      {/* Booth Rent */}
      <div className="glass rounded-xl p-6 mb-6">
        <h2 className="text-text-primary font-medium text-sm uppercase tracking-widest mb-4">
          Booth Rent
        </h2>
        <BoothRentEditor staffId={staff.id} booth={booth} />
      </div>

      {/* Appointment history */}
      {appointments.length > 0 && (
        <div className="glass rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-text-primary font-medium text-sm uppercase tracking-widest">
              Recent Appointments
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Date & Time", "Service", "Price", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-text-muted text-xs uppercase tracking-widest font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-surface-elevated transition-colors">
                  <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                    {fmtDateTime(a.start_time)}
                  </td>
                  <td className="px-4 py-3 text-text-primary">{a.services?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {a.services ? fmt(a.services.price_cents) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payroll history */}
      {payroll.length > 0 && (
        <div className="glass rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-text-primary font-medium text-sm uppercase tracking-widest">
              Payroll Records
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Period", "Net Payout", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-text-muted text-xs uppercase tracking-widest font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payroll.map((r) => (
                <tr key={r.id} className="hover:bg-surface-elevated transition-colors">
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {fmtDate(r.period_start)} – {fmtDate(r.period_end)}
                  </td>
                  <td className="px-4 py-3 text-gold font-medium">{fmt(r.net_payout_cents)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.status === "paid"
                        ? "bg-success/15 text-success"
                        : "bg-gold/15 text-gold"
                    }`}>
                      {r.status === "paid" ? "Paid" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
