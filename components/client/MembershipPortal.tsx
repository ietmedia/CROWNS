"use client";

import { useState, useTransition } from "react";
import type { Membership, ClientMembership } from "@/actions/memberships";

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

export default function MembershipPortal({
  currentMembership,
  tiers,
  subscribeFn,
  cancelFn,
}: {
  currentMembership: ClientMembership | null;
  tiers: Membership[];
  subscribeFn: (id: string) => Promise<{ success?: boolean; error?: string }>;
  cancelFn: (id: string) => Promise<{ success?: boolean; error?: string }>;
}) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeMembership = currentMembership?.memberships as Membership | null;

  function handleSubscribe(membershipId: string) {
    setError(null);
    startTransition(async () => {
      const result = await subscribeFn(membershipId);
      if (result.error) setError(result.error);
    });
  }

  function handleCancel() {
    if (!currentMembership) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelFn(currentMembership.id);
      if (result.error) setError(result.error);
      else setConfirmCancel(false);
    });
  }

  if (currentMembership && activeMembership) {
    return (
      <div className="space-y-6">
        {/* Current membership card */}
        <div className="glass-gold rounded-2xl p-8">
          <p className="text-text-muted text-xs uppercase tracking-widest mb-2">Active Membership</p>
          <h2 className="font-display text-3xl text-gradient-gold mb-1">{activeMembership.name}</h2>
          <p className="text-gold text-xl font-medium mb-4">
            {fmt(activeMembership.price_cents)}/{activeMembership.billing_interval === "quarterly" ? "quarter" : "month"}
          </p>
          {activeMembership.description && (
            <p className="text-text-secondary text-sm mb-4">{activeMembership.description}</p>
          )}
          {activeMembership.features.length > 0 && (
            <ul className="space-y-2 mb-6">
              {activeMembership.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-text-secondary text-sm">
                  <span className="text-gold mt-0.5">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-4 pt-4 border-t border-gold/20 text-xs text-text-muted">
            <span>Member since {fmtDate(currentMembership.started_at)}</span>
            {currentMembership.next_billing_date && (
              <span>Next billing {fmtDate(currentMembership.next_billing_date)}</span>
            )}
          </div>
        </div>

        {error && <p className="text-error text-sm">{error}</p>}

        {/* Cancel */}
        {!confirmCancel ? (
          <button
            onClick={() => setConfirmCancel(true)}
            className="text-text-muted text-sm hover:text-error transition-colors"
          >
            Cancel membership
          </button>
        ) : (
          <div className="glass rounded-xl p-4 flex items-center gap-4">
            <p className="text-text-secondary text-sm flex-1">
              Cancel your membership? Access ends immediately.
            </p>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="text-error text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {isPending ? "Cancelling…" : "Confirm"}
            </button>
            <button
              onClick={() => setConfirmCancel(false)}
              className="text-text-muted text-sm hover:text-text-secondary transition-colors"
            >
              Keep it
            </button>
          </div>
        )}
      </div>
    );
  }

  // No membership — show tiers to pick from
  return (
    <div className="space-y-6">
      <p className="text-text-secondary">
        Join a membership tier to unlock priority booking, exclusive discounts, and more.
      </p>

      {error && <p className="text-error text-sm">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tiers.map((tier) => (
          <div key={tier.id} className="glass rounded-2xl p-6 flex flex-col">
            <h3 className="font-display text-xl text-text-primary mb-1">{tier.name}</h3>
            <p className="text-gold text-lg font-medium mb-2">
              {fmt(tier.price_cents)}/{tier.billing_interval === "quarterly" ? "qtr" : "mo"}
            </p>
            {tier.description && (
              <p className="text-text-secondary text-sm mb-3">{tier.description}</p>
            )}
            {tier.features.length > 0 && (
              <ul className="space-y-1.5 mb-4 flex-1">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-text-muted text-xs">
                    <span className="text-gold mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => handleSubscribe(tier.id)}
              disabled={isPending}
              className="mt-auto bg-accent text-accent-foreground rounded-full py-2.5 text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
            >
              {isPending ? "Processing…" : "Join Now"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
