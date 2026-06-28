import { createInsforgeAdmin } from "@/lib/insforge-admin";

// ─── Data helpers ─────────────────────────────────────────────────────────────

function fmtRange(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

async function getReportData(range: "7d" | "30d" | "90d") {
  const insforge = createInsforgeAdmin();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  const [apptResult, staffResult] = await Promise.all([
    insforge.database
      .from("appointments")
      .select(
        "id, status, payment_status, start_time, services(id, name, price_cents, deposit_cents), staff(id, name)"
      )
      .gte("start_time", start.toISOString())
      .lte("start_time", end.toISOString())
      .neq("status", "cancelled"),
    insforge.database
      .from("staff")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
  ]);

  type ApptRow = {
    id: string;
    status: string;
    payment_status: string;
    start_time: string;
    services: { id: string; name: string; price_cents: number; deposit_cents: number } | null;
    staff: { id: string; name: string } | null;
  };

  const appointments = (apptResult.data ?? []) as unknown as ApptRow[];
  const staffList = (staffResult.data ?? []) as { id: string; name: string }[];

  const completed = appointments.filter((a) => a.status === "completed");
  const confirmed = appointments.filter((a) => a.status === "confirmed");

  // Total revenue from completed (fully paid) + confirmed (deposit paid)
  let totalRevenueCents = 0;
  let completedRevenue = 0;
  let depositRevenue = 0;

  for (const a of completed) {
    const price = a.services?.price_cents ?? 0;
    completedRevenue += price;
    totalRevenueCents += price;
  }
  for (const a of confirmed) {
    const deposit = a.services?.deposit_cents ?? 0;
    depositRevenue += deposit;
    totalRevenueCents += deposit;
  }

  // Revenue by service
  const byService: Record<string, { name: string; count: number; revenue: number }> = {};
  for (const a of completed) {
    const svc = a.services;
    if (!svc) continue;
    if (!byService[svc.id]) byService[svc.id] = { name: svc.name, count: 0, revenue: 0 };
    byService[svc.id].count++;
    byService[svc.id].revenue += svc.price_cents;
  }

  // Revenue by staff
  const byStaff: Record<string, { name: string; count: number; revenue: number }> = {};
  for (const a of completed) {
    const stf = a.staff;
    if (!stf) continue;
    if (!byStaff[stf.id]) byStaff[stf.id] = { name: stf.name, count: 0, revenue: 0 };
    byStaff[stf.id].count++;
    byStaff[stf.id].revenue += a.services?.price_cents ?? 0;
  }

  // Daily revenue for sparkline
  const dailyMap: Record<string, number> = {};
  for (const a of appointments) {
    if (!["completed", "confirmed"].includes(a.status)) continue;
    const day = a.start_time.slice(0, 10);
    const earned =
      a.status === "completed"
        ? (a.services?.price_cents ?? 0)
        : (a.services?.deposit_cents ?? 0);
    dailyMap[day] = (dailyMap[day] ?? 0) + earned;
  }

  // Fill all days
  const daily: { date: string; revenue: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    daily.push({ date: key, revenue: dailyMap[key] ?? 0 });
  }

  const noShows = appointments.filter((a) => a.status === "no_show").length;

  return {
    range: fmtRange(start, end),
    totalRevenueCents,
    completedRevenue,
    depositRevenue,
    totalAppointments: appointments.length,
    completedCount: completed.length,
    confirmedCount: confirmed.length,
    noShows,
    byService: Object.values(byService).sort((a, b) => b.revenue - a.revenue),
    byStaff: Object.values(byStaff).sort((a, b) => b.revenue - a.revenue),
    daily,
    staffList,
  };
}

// ─── Mini bar chart component ─────────────────────────────────────────────────

function MiniBarChart({ daily }: { daily: { date: string; revenue: number }[] }) {
  const max = Math.max(...daily.map((d) => d.revenue), 1);
  return (
    <div className="flex items-end gap-0.5 h-16">
      {daily.map((d) => {
        const pct = (d.revenue / max) * 100;
        const dateLabel = new Date(d.date + "T12:00:00").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        return (
          <div
            key={d.date}
            title={`${dateLabel}: ${fmt(d.revenue)}`}
            className="flex-1 bg-gold/60 hover:bg-gold rounded-sm transition-colors cursor-default"
            style={{ height: `${Math.max(pct, 2)}%` }}
          />
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = (["7d", "30d", "90d"].includes(params.range ?? "") ? params.range : "30d") as
    | "7d"
    | "30d"
    | "90d";

  const data = await getReportData(range);

  const RANGES = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
  ];

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl text-text-primary mb-1">Revenue Reports</h1>
          <p className="text-text-muted text-sm">{data.range}</p>
        </div>

        {/* Range picker */}
        <div className="flex rounded-full border border-border-light p-1">
          {RANGES.map((r) => (
            <a
              key={r.value}
              href={`?range=${r.value}`}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                range === r.value
                  ? "bg-accent text-accent-foreground"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {r.label}
            </a>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Revenue", value: fmt(data.totalRevenueCents) },
          { label: "Appointments", value: data.totalAppointments.toString() },
          { label: "Completed", value: data.completedCount.toString() },
          { label: "No-Shows", value: data.noShows.toString() },
        ].map((kpi) => (
          <div key={kpi.label} className="glass rounded-xl p-4 text-center">
            <p className="text-gold text-2xl font-display">{kpi.value}</p>
            <p className="text-text-muted text-xs mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue breakdown */}
      {data.totalRevenueCents > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="glass rounded-xl p-4">
            <p className="text-text-muted text-xs uppercase tracking-widest mb-1">
              Completed Revenue
            </p>
            <p className="text-text-primary text-xl font-display">
              {fmt(data.completedRevenue)}
            </p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-text-muted text-xs uppercase tracking-widest mb-1">
              Deposits Collected
            </p>
            <p className="text-text-primary text-xl font-display">
              {fmt(data.depositRevenue)}
            </p>
          </div>
        </div>
      )}

      {/* Daily chart */}
      <div className="glass rounded-xl p-6 mb-6">
        <p className="text-text-muted text-xs uppercase tracking-widest mb-4">
          Daily Revenue — {range}
        </p>
        <MiniBarChart daily={data.daily} />
        <div className="flex justify-between mt-1">
          <span className="text-text-muted text-xs">
            {new Date(data.daily[0]?.date + "T12:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
          <span className="text-text-muted text-xs">Today</span>
        </div>
      </div>

      {/* By service + by staff */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Revenue by service */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-text-primary font-medium text-sm uppercase tracking-widest">
              By Service
            </h2>
          </div>
          {data.byService.length === 0 ? (
            <p className="text-text-muted text-xs px-5 py-6">No completed appointments.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.byService.slice(0, 8).map((s) => (
                <li key={s.name} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-text-primary text-sm">{s.name}</p>
                    <p className="text-text-muted text-xs">{s.count} booking{s.count !== 1 ? "s" : ""}</p>
                  </div>
                  <span className="text-gold text-sm font-medium">{fmt(s.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Revenue by staff */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-text-primary font-medium text-sm uppercase tracking-widest">
              By Stylist
            </h2>
          </div>
          {data.byStaff.length === 0 ? (
            <p className="text-text-muted text-xs px-5 py-6">No completed appointments.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.byStaff.map((s) => (
                <li key={s.name} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-text-primary text-sm">{s.name}</p>
                    <p className="text-text-muted text-xs">{s.count} completed</p>
                  </div>
                  <span className="text-gold text-sm font-medium">{fmt(s.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
