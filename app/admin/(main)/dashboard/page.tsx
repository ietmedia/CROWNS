import { getAdminStats } from "@/actions/admin";
import StatusUpdater from "@/components/admin/StatusUpdater";

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  });
}

export default async function AdminDashboardPage() {
  const { todayCount, todayRevenueCents, totalClients, avgRating, todayAppointments } =
    await getAdminStats();

  const stats = [
    { label: "Today's Appointments", value: String(todayCount) },
    { label: "Today's Revenue", value: fmt(todayRevenueCents) },
    { label: "Total Clients", value: String(totalClients) },
    { label: "Avg. Rating", value: avgRating > 0 ? `${avgRating} ★` : "—" },
  ];

  return (
    <div>
      <h1 className="font-display text-4xl text-text-primary mb-1">Dashboard</h1>
      <p className="text-text-secondary text-sm mb-8">
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "America/New_York",
        })}
      </p>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-xl p-5">
            <p className="text-text-muted text-xs uppercase tracking-widest mb-2">
              {s.label}
            </p>
            <p className="font-display text-3xl text-gradient-gold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Today's appointments */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-text-primary font-medium">Today&apos;s Appointments</h2>
        </div>

        {todayAppointments.length === 0 ? (
          <p className="text-text-muted text-sm px-6 py-8 text-center">
            No appointments scheduled for today.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {todayAppointments.map((appt) => (
              <div
                key={appt.id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                {/* Time */}
                <div className="w-20 shrink-0">
                  <span className="text-gold text-sm font-medium">
                    {fmtTime(appt.start_time)}
                  </span>
                </div>

                {/* Client + service */}
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-sm font-medium truncate">
                    {appt.clients?.full_name ?? (appt as { guest_name?: string | null }).guest_name ?? "Walk-in"}
                  </p>
                  <p className="text-text-muted text-xs mt-0.5">
                    {appt.services?.name ?? "—"} · {appt.staff?.name ?? "Any"}
                  </p>
                </div>

                {/* Price */}
                <div className="w-20 shrink-0 text-right hidden sm:block">
                  <span className="text-text-secondary text-sm">
                    {appt.services ? fmt(appt.services.price_cents) : ""}
                  </span>
                </div>

                {/* Status updater */}
                <div className="shrink-0">
                  <StatusUpdater
                    appointmentId={appt.id}
                    status={appt.status}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
