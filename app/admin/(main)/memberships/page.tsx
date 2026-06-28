import { getMemberships, getAdminClientMemberships } from "@/actions/memberships";
import MembershipsAdmin from "@/components/admin/MembershipsAdmin";

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function MembershipsAdminPage() {
  const [{ data: memberships }, { data: subscribers }] = await Promise.all([
    getMemberships(),
    getAdminClientMemberships(),
  ]);

  const activeCount = subscribers.filter((s) => s.status === "active").length;

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-text-primary mb-1">Memberships</h1>
        <p className="text-text-muted text-sm">{memberships.length} tiers · {activeCount} active subscribers</p>
      </div>

      <MembershipsAdmin initialMemberships={memberships} />

      {/* Active subscribers */}
      {subscribers.length > 0 && (
        <div className="glass rounded-xl overflow-hidden mt-8">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-text-primary font-medium text-sm uppercase tracking-widest">
              Active Subscribers
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Client", "Membership", "Status", "Since", "Next Billing"].map((h) => (
                  <th key={h} className="px-4 py-3 text-text-muted text-xs uppercase tracking-widest font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subscribers.map((s) => (
                <tr key={s.id} className="hover:bg-surface-elevated transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-text-primary">{(s.clients as { full_name: string } | null)?.full_name ?? "—"}</p>
                    <p className="text-text-muted text-xs">{(s.clients as { email: string } | null)?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {(s.memberships as { name: string } | null)?.name ?? "—"}
                    {s.memberships && (
                      <span className="text-text-muted text-xs ml-1">
                        {fmt((s.memberships as { price_cents: number }).price_cents)}/mo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      s.status === "active"
                        ? "bg-success/15 text-success"
                        : s.status === "past_due"
                        ? "bg-error/15 text-error"
                        : "bg-white/10 text-text-muted"
                    }`}>
                      {s.status === "past_due" ? "Past Due" : s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{fmtDate(s.started_at)}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {s.next_billing_date ? fmtDate(s.next_billing_date) : "—"}
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
