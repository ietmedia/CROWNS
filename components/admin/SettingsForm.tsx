"use client";

import { useState, useTransition } from "react";
import { updateSettings, type SalonSettings } from "@/actions/settings";

function displayCents(c: number) {
  return (c / 100).toFixed(2);
}
function inputToCents(s: string) {
  return Math.round(parseFloat(s || "0") * 100);
}

export default function SettingsForm({
  initialSettings,
}: {
  initialSettings: SalonSettings;
}) {
  const [form, setForm] = useState({
    salon_name: initialSettings.salon_name,
    phone: initialSettings.phone,
    email: initialSettings.email,
    address: initialSettings.address,
    open_time: initialSettings.open_time,
    close_time: initialSettings.close_time,
    slot_interval_minutes: initialSettings.slot_interval_minutes,
    cancellation_policy_hours: initialSettings.cancellation_policy_hours,
    no_show_fee: displayCents(initialSettings.no_show_fee_cents),
    reminder_hours_before: initialSettings.reminder_hours_before,
    google_calendar_id: initialSettings.google_calendar_id ?? "",
  });

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function patch(k: keyof typeof form, v: string | number) {
    setForm((p) => ({ ...p, [k]: v }));
    setSaved(false);
  }

  function handleSave() {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const result = await updateSettings({
        salon_name: form.salon_name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        open_time: form.open_time,
        close_time: form.close_time,
        slot_interval_minutes: Number(form.slot_interval_minutes),
        cancellation_policy_hours: Number(form.cancellation_policy_hours),
        no_show_fee_cents: inputToCents(String(form.no_show_fee)),
        reminder_hours_before: Number(form.reminder_hours_before),
        google_calendar_id: form.google_calendar_id,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Salon Info */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h2 className="text-text-primary font-medium text-sm uppercase tracking-widest">
          Salon Information
        </h2>
        <div>
          <label className="block text-text-muted text-xs mb-1">Salon Name</label>
          <input
            type="text"
            value={form.salon_name}
            onChange={(e) => patch("salon_name", e.target.value)}
            className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-muted text-xs mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => patch("phone", e.target.value)}
              className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
          <div>
            <label className="block text-text-muted text-xs mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => patch("email", e.target.value)}
              className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
        </div>
        <div>
          <label className="block text-text-muted text-xs mb-1">Address</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => patch("address", e.target.value)}
            className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>
      </div>

      {/* Hours */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h2 className="text-text-primary font-medium text-sm uppercase tracking-widest">
          Business Hours
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-text-muted text-xs mb-1">Open Time</label>
            <input
              type="time"
              value={form.open_time}
              onChange={(e) => patch("open_time", e.target.value)}
              className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
          <div>
            <label className="block text-text-muted text-xs mb-1">Close Time</label>
            <input
              type="time"
              value={form.close_time}
              onChange={(e) => patch("close_time", e.target.value)}
              className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
          <div>
            <label className="block text-text-muted text-xs mb-1">Slot Interval (min)</label>
            <select
              value={form.slot_interval_minutes}
              onChange={(e) => patch("slot_interval_minutes", parseInt(e.target.value))}
              className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            >
              {[15, 30, 45, 60].map((v) => (
                <option key={v} value={v}>{v} min</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Policy */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h2 className="text-text-primary font-medium text-sm uppercase tracking-widest">
          Booking Policy
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-text-muted text-xs mb-1">Cancellation Window (hrs)</label>
            <input
              type="number"
              min={0}
              value={form.cancellation_policy_hours}
              onChange={(e) => patch("cancellation_policy_hours", parseInt(e.target.value) || 0)}
              className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
          <div>
            <label className="block text-text-muted text-xs mb-1">No-Show Fee ($)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.no_show_fee}
              onChange={(e) => patch("no_show_fee", e.target.value)}
              className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
          <div>
            <label className="block text-text-muted text-xs mb-1">Reminder Lead Time (hrs)</label>
            <input
              type="number"
              min={1}
              value={form.reminder_hours_before}
              onChange={(e) => patch("reminder_hours_before", parseInt(e.target.value) || 24)}
              className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h2 className="text-text-primary font-medium text-sm uppercase tracking-widest">
          Integrations
        </h2>
        <div>
          <label className="block text-text-muted text-xs mb-1">Google Calendar ID</label>
          <input
            type="text"
            value={form.google_calendar_id}
            onChange={(e) => patch("google_calendar_id", e.target.value)}
            placeholder="your-calendar@group.calendar.google.com"
            className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold"
          />
          <p className="text-text-muted text-xs mt-1">
            Used to sync appointments. Found in Google Calendar → Settings → Calendar ID.
          </p>
        </div>

        <div className="pt-2 border-t border-border-light">
          <p className="text-text-muted text-xs uppercase tracking-widest mb-2">Stripe</p>
          <p className="text-text-secondary text-xs">
            Keys are managed via environment variables (<code className="text-text-muted">STRIPE_SECRET_KEY</code>,{" "}
            <code className="text-text-muted">STRIPE_PUBLISHABLE_KEY</code>,{" "}
            <code className="text-text-muted">STRIPE_WEBHOOK_SECRET</code>) in{" "}
            <code className="text-text-muted">.env.local</code>. Webhook endpoint:{" "}
            <code className="text-text-muted">/api/stripe/webhook</code>.
          </p>
        </div>
      </div>

      {error && <p className="text-error text-sm">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-accent text-accent-foreground rounded-full px-6 py-2.5 text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save Settings"}
        </button>
        {saved && (
          <span className="text-success text-sm">Settings saved successfully.</span>
        )}
      </div>
    </div>
  );
}
