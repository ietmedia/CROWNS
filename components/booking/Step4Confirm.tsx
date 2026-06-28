"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { createBooking, createCheckoutSession } from "@/actions/booking";
import { formatCents, formatDateTime } from "@/lib/utils";
import type { Service, Staff } from "@/types";

interface Props {
  service: Service;
  staff: Staff | null;
  staffIdChoice: string;
  startTime: string;
  endTime: string;
  onBack: () => void;
}

export default function Step4Confirm({
  service,
  staff,
  staffIdChoice,
  startTime,
  endTime,
  onBack,
}: Props) {
  const [intakeNotes, setIntakeNotes] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const requiresDeposit = service.deposit_cents > 0;
  const staffDisplay = staff ? staff.name : "Any available stylist";

  function handleSubmit() {
    setError("");
    const input = {
      serviceId: service.id,
      staffId: staffIdChoice === "any" ? null : staffIdChoice,
      startTime,
      endTime,
      intakeNotes,
      depositCents: service.deposit_cents,
      priceLabel: formatCents(service.price_cents),
      serviceName: service.name,
    };

    startTransition(async () => {
      const action = requiresDeposit ? createCheckoutSession : createBooking;
      const result = await action(input);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="max-w-xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-text-secondary text-sm hover:text-gold transition-colors mb-8"
      >
        ← Back to time selection
      </button>

      <div className="text-center mb-10">
        <h2 className="font-display text-4xl text-text-primary mb-3">
          Confirm Your Booking
        </h2>
        <p className="text-text-secondary text-sm">
          Review your appointment details below.
        </p>
      </div>

      {/* Summary card */}
      <div className="glass-gold rounded-2xl p-6 mb-6">
        <div className="space-y-4">
          <Row label="Service" value={service.name} />
          <Row
            label="Duration"
            value={`${service.duration_minutes} minutes`}
          />
          <Row label="Stylist" value={staffDisplay} />
          <Row label="Date & Time" value={formatDateTime(startTime)} />
          <div className="border-t border-border-light pt-4 space-y-2">
            <Row label="Service Price" value={formatCents(service.price_cents)} />
            {requiresDeposit ? (
              <Row
                label="Deposit Due Now"
                value={formatCents(service.deposit_cents)}
                highlight
              />
            ) : (
              <Row label="Due at Appointment" value={formatCents(service.price_cents)} highlight />
            )}
            {requiresDeposit && (
              <p className="text-text-muted text-xs">
                Remaining {formatCents(service.price_cents - service.deposit_cents)} due at your appointment.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Intake notes */}
      <div className="mb-6">
        <label className="text-text-secondary text-sm font-medium block mb-1.5">
          Notes for your stylist{" "}
          <span className="text-text-muted font-normal">(optional)</span>
        </label>
        <textarea
          value={intakeNotes}
          onChange={(e) => setIntakeNotes(e.target.value)}
          placeholder="Allergies, preferences, what you're looking to achieve…"
          rows={3}
          maxLength={500}
          className="w-full bg-surface-card border border-border-light rounded-lg px-4 py-3 text-text-primary text-sm placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold resize-none"
        />
      </div>

      {error && (
        <p className="text-error text-xs text-center mb-4">{error}</p>
      )}

      {/* CTA */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full bg-accent text-accent-foreground rounded-full py-4 text-sm font-medium hover:bg-gold-light hover:glow-gold transition-all duration-300 disabled:opacity-60"
      >
        {isPending
          ? requiresDeposit
            ? "Redirecting to payment…"
            : "Booking…"
          : requiresDeposit
          ? `Pay Deposit ${formatCents(service.deposit_cents)} & Book`
          : "Book Appointment"}
      </motion.button>

      <p className="text-text-muted text-xs text-center mt-4">
        By booking you agree to our cancellation policy. Cancellations within 24 hours may forfeit your deposit.
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-secondary text-sm">{label}</span>
      <span
        className={`text-sm font-medium ${
          highlight ? "text-gold" : "text-text-primary"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
