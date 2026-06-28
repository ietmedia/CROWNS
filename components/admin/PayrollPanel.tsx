"use client";

import { useState, useTransition } from "react";
import { type StaffPayrollSummary, type PayrollRecord, savePayrollRecords, markPayrollPaid } from "@/actions/payroll";
import { useRouter } from "next/navigation";

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function PayrollPanel({
  summaries,
  history,
  periodStart,
  periodEnd,
}: {
  summaries: StaffPayrollSummary[];
  history: PayrollRecord[];
  periodStart: string;
  periodEnd: string;
}) {
  const router = useRouter();
  const [start, setStart] = useState(periodStart);
  const [end, setEnd] = useState(periodEnd);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [paidErrors, setPaidErrors] = useState<Record<string, string>>({});

  const totalPayout = summaries.reduce((s, r) => s + r.net_payout_cents, 0);

  function handleSearch() {
    router.push(`?start=${start}&end=${end}`);
  }

  function handleSave() {
    setSaveError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await savePayrollRecords(summaries, periodStart, periodEnd);
      if (result.error) { setSaveError(result.error); return; }
      setSaved(true);
    });
  }

  function handleMarkPaid(id: string) {
    startTransition(async () => {
      const result = await markPayrollPaid(id);
      if (result.error) {
        setPaidErrors((p) => ({ ...p, [id]: result.error! }));
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Period picker */}
      <div className="glass rounded-xl p-5">
        <p className="text-text-muted text-xs uppercase tracking-widest mb-3">Pay Period</p>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-text-muted text-xs mb-1">From</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
          <div>
            <label className="block text-text-muted text-xs mb-1">To</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-gold-light transition-colors"
          >
            Calculate
          </button>
        </div>
      </div>

      {/* Current period summary */}
      {summaries.length === 0 ? (
        <p className="text-text-muted text-sm text-center py-10">
          No completed appointments in this period.
        </p>
      ) : (
        <>
          <div className="glass rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-text-primary font-medium text-sm uppercase tracking-widest">
                {fmtDate(periodStart)} — {fmtDate(periodEnd)}
              </h2>
              <span className="text-gold text-sm font-medium">Total: {fmt(totalPayout)}</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Stylist", "Services", "Gross", "Commission", "Booth Rent", "Net Payout"].map((h) => (
                    <th key={h} className="px-4 py-3 text-text-muted text-xs uppercase tracking-widest font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summaries.map((s) => (
                  <tr key={s.staff_id} className="hover:bg-surface-elevated transition-colors">
                    <td className="px-4 py-3 text-text-primary font-medium">{s.staff_name}</td>
                    <td className="px-4 py-3 text-text-secondary">{s.total_services}</td>
                    <td className="px-4 py-3 text-text-secondary">{fmt(s.gross_revenue_cents)}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {fmt(s.commission_cents)}
                      <span className="text-text-muted text-xs ml-1">
                        ({Math.round(s.commission_rate * 100)}%)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {s.booth_rent_cents > 0 ? (
                        <span className="text-error">−{fmt(s.booth_rent_cents)}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-gold font-medium">{fmt(s.net_payout_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isPending || saved}
              className="bg-accent text-accent-foreground rounded-full px-5 py-2.5 text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
            >
              {isPending ? "Saving…" : saved ? "Saved ✓" : "Save Payroll Records"}
            </button>
            {saveError && <p className="text-error text-xs">{saveError}</p>}
            {saved && (
              <p className="text-success text-xs">
                Payroll records saved. Mark as paid when distributed.
              </p>
            )}
          </div>
        </>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="glass rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-text-primary font-medium text-sm uppercase tracking-widest">
              Payroll History
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Stylist", "Period", "Net Payout", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-text-muted text-xs uppercase tracking-widest font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.map((r) => (
                <tr key={r.id} className="hover:bg-surface-elevated transition-colors">
                  <td className="px-4 py-3 text-text-primary">
                    {(r.staff as { name: string } | null)?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {fmtDate(r.period_start)} – {fmtDate(r.period_end)}
                  </td>
                  <td className="px-4 py-3 text-gold font-medium">{fmt(r.net_payout_cents)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        r.status === "paid"
                          ? "bg-success/15 text-success"
                          : "bg-gold/15 text-gold"
                      }`}
                    >
                      {r.status === "paid" ? "Paid" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === "pending" && (
                      <button
                        onClick={() => handleMarkPaid(r.id)}
                        disabled={isPending}
                        className="text-text-muted text-xs hover:text-success transition-colors disabled:opacity-40"
                      >
                        Mark Paid
                      </button>
                    )}
                    {paidErrors[r.id] && (
                      <p className="text-error text-xs">{paidErrors[r.id]}</p>
                    )}
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
