"use client";

import { useState, useTransition } from "react";
import { upsertBoothRenter } from "@/actions/booth";

type Booth = {
  id: string;
  monthly_rent_cents: number;
  billing_day: number;
  stripe_subscription_id: string | null;
  is_active: boolean;
} | null;

function centsToDisplay(c: number) {
  return (c / 100).toFixed(2);
}
function displayToCents(s: string) {
  return Math.round(parseFloat(s || "0") * 100);
}

export default function BoothRentEditor({
  staffId,
  booth,
}: {
  staffId: string;
  booth: Booth;
}) {
  const [rent, setRent] = useState(
    booth ? centsToDisplay(booth.monthly_rent_cents) : "0.00"
  );
  const [billingDay, setBillingDay] = useState(booth?.billing_day ?? 1);
  const [subId, setSubId] = useState(booth?.stripe_subscription_id ?? "");
  const [isActive, setIsActive] = useState(booth?.is_active ?? true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const result = await upsertBoothRenter(staffId, {
        monthly_rent_cents: displayToCents(rent),
        billing_day: billingDay,
        stripe_subscription_id: subId,
        is_active: isActive,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-text-muted text-xs mb-1">Monthly Rent ($)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={rent}
            onChange={(e) => setRent(e.target.value)}
            className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>

        <div>
          <label className="block text-text-muted text-xs mb-1">Billing Day (1–28)</label>
          <input
            type="number"
            min={1}
            max={28}
            value={billingDay}
            onChange={(e) =>
              setBillingDay(Math.min(28, Math.max(1, parseInt(e.target.value) || 1)))
            }
            className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>

        <div>
          <label className="block text-text-muted text-xs mb-1">Stripe Subscription ID</label>
          <input
            type="text"
            value={subId}
            onChange={(e) => setSubId(e.target.value)}
            placeholder="sub_…"
            className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="rounded border-border-light text-gold focus:ring-gold"
        />
        <span className="text-text-secondary text-sm">Booth rent active</span>
      </label>

      {error && <p className="text-error text-xs">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save Booth Settings"}
        </button>
        {saved && <span className="text-success text-xs">Saved</span>}
      </div>

      {booth?.stripe_subscription_id && (
        <p className="text-text-muted text-xs">
          Stripe subscription:{" "}
          <code className="text-text-secondary">{booth.stripe_subscription_id}</code>
        </p>
      )}
    </div>
  );
}
