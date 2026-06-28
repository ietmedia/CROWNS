import Link from "next/link";
import { getAdminAppointments, getActiveStaff } from "@/actions/admin";
import StatusBadge from "@/components/admin/StatusBadge";
import StatusUpdater from "@/components/admin/StatusUpdater";
import AdminNewBookingButton from "@/components/admin/AdminNewBookingButton";

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "America/New_York",
    }),
    time: d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/New_York",
    }),
  };
}

const STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No-Show" },
];

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    staff_id?: string;
    date_from?: string;
    date_to?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const page = parseInt(sp.page ?? "1", 10);

  const [{ data, total, totalPages }, staff] = await Promise.all([
    getAdminAppointments({
      status: sp.status,
      staff_id: sp.staff_id,
      date_from: sp.date_from,
      date_to: sp.date_to,
      page,
    }),
    getActiveStaff(),
  ]);

  type Appt = (typeof data)[number] & {
    guest_name: string | null;
    guest_phone: string | null;
    clients: { id: string; full_name: string; email: string; phone: string | null } | null;
    staff: { id: string; name: string } | null;
    services: { id: string; name: string; price_cents: number; deposit_cents: number } | null;
  };

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { status: sp.status, staff_id: sp.staff_id, date_from: sp.date_from, date_to: sp.date_to, page: sp.page, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all") params.set(k, v);
    }
    return `/admin/bookings?${params.toString()}`;
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl text-text-primary mb-1">Bookings</h1>
          <p className="text-text-secondary text-sm">
            {total} appointment{total !== 1 ? "s" : ""}
          </p>
        </div>
        <AdminNewBookingButton />
      </div>

      {/* Filters */}
      <form method="get" action="/admin/bookings" className="glass rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-end">
        {/* Date from */}
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-text-muted text-xs uppercase tracking-widest">From</label>
          <input
            name="date_from"
            type="date"
            defaultValue={sp.date_from ?? ""}
            className="bg-surface-card border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>

        {/* Date to */}
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-text-muted text-xs uppercase tracking-widest">To</label>
          <input
            name="date_to"
            type="date"
            defaultValue={sp.date_to ?? ""}
            className="bg-surface-card border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-text-muted text-xs uppercase tracking-widest">Status</label>
          <select
            name="status"
            defaultValue={sp.status ?? "all"}
            className="bg-surface-card border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Staff */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-text-muted text-xs uppercase tracking-widest">Staff</label>
          <select
            name="staff_id"
            defaultValue={sp.staff_id ?? ""}
            className="bg-surface-card border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
          >
            <option value="">All Staff</option>
            {(staff as { id: string; name: string }[]).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-gold-light transition-colors"
          >
            Filter
          </button>
          <Link
            href="/admin/bookings"
            className="glass rounded-lg px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Clear
          </Link>
        </div>
      </form>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        {data.length === 0 ? (
          <p className="text-text-muted text-sm px-6 py-10 text-center">
            No appointments match your filters.
          </p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {["Date / Time", "Client", "Service", "Staff", "Price", "Status"].map((h) => (
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
                  {(data as Appt[]).map((appt) => {
                    const { date, time } = fmtDateTime(appt.start_time);
                    return (
                      <tr key={appt.id} className="hover:bg-surface-elevated transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-text-primary">{date}</p>
                          <p className="text-text-muted text-xs">{time}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-text-primary">
                            {appt.clients?.full_name ?? appt.guest_name ?? "—"}
                          </p>
                          <p className="text-text-muted text-xs">
                            {appt.clients?.email ?? appt.guest_phone ?? (appt.guest_name ? "Walk-in" : "")}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          {appt.services?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          {appt.staff?.name ?? "Any"}
                        </td>
                        <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                          {appt.services ? fmt(appt.services.price_cents) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusUpdater
                            appointmentId={appt.id}
                            status={appt.status}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-text-muted text-xs">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={buildUrl({ page: String(page - 1) })}
                      className="glass px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary text-xs transition-colors"
                    >
                      ← Prev
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={buildUrl({ page: String(page + 1) })}
                      className="glass px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary text-xs transition-colors"
                    >
                      Next →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
