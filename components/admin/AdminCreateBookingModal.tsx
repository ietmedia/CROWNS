"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  getAdminBookingFormData,
  getAdminAvailableSlots,
  searchClients,
  createAdminBooking,
} from "@/actions/admin";

type FormData = Awaited<ReturnType<typeof getAdminBookingFormData>>;
type Client = { id: string; full_name: string; email: string; phone: string | null };

interface Props {
  open: boolean;
  onClose: () => void;
  prefillDate?: string;
  prefillTime?: string;
}

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

function fmtSlot(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  });
}

export default function AdminCreateBookingModal({ open, onClose, prefillDate, prefillTime }: Props) {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [mode, setMode] = useState<"existing" | "walkin">("existing");

  // Client search
  const [clientQuery, setClientQuery] = useState("");
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Walk-in
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  // Service + staff
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");

  // Date + time
  const [date, setDate] = useState(prefillDate ?? "");
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Notes
  const [notes, setNotes] = useState("");

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load form data on mount
  useEffect(() => {
    if (open && !formData) {
      getAdminBookingFormData().then(setFormData);
    }
  }, [open, formData]);

  // Prefill date/time
  useEffect(() => {
    if (prefillDate) setDate(prefillDate);
    if (prefillTime) {
      // We'll match the prefill time to a slot after slots load
    }
  }, [prefillDate, prefillTime]);

  // Load slots when date + service change
  useEffect(() => {
    if (!date || !serviceId) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }
    setLoadingSlots(true);
    setSelectedSlot(null);
    getAdminAvailableSlots(date, serviceId, staffId || null).then(s => {
      setSlots(s);
      setLoadingSlots(false);
      // Auto-select prefill time if provided
      if (prefillTime) {
        const match = s.find(slot => slot.start.includes(prefillTime));
        if (match) setSelectedSlot(match);
      }
    });
  }, [date, serviceId, staffId, prefillTime]);

  // Client search debounce
  const handleClientSearch = useCallback((q: string) => {
    setClientQuery(q);
    setSelectedClient(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.length < 2) { setClientResults([]); return; }
    searchTimeout.current = setTimeout(() => {
      searchClients(q).then(setClientResults);
    }, 300);
  }, []);

  const handleSubmit = async () => {
    setError(null);
    if (!serviceId) { setError("Please select a service."); return; }
    if (!selectedSlot) { setError("Please select a date and time."); return; }
    if (mode === "existing" && !selectedClient) { setError("Please select a client."); return; }
    if (mode === "walkin" && !guestName.trim()) { setError("Please enter the client name."); return; }

    setSubmitting(true);
    const result = await createAdminBooking({
      clientId: mode === "existing" ? selectedClient!.id : undefined,
      guestName: mode === "walkin" ? guestName : undefined,
      guestPhone: mode === "walkin" ? guestPhone : undefined,
      guestEmail: mode === "walkin" ? guestEmail : undefined,
      serviceId,
      staffId: staffId || null,
      startTime: selectedSlot.start,
      endTime: selectedSlot.end,
      notes,
    });

    setSubmitting(false);
    if (result.error) { setError(result.error); return; }
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      handleReset();
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    setMode("existing");
    setClientQuery("");
    setClientResults([]);
    setSelectedClient(null);
    setGuestName(""); setGuestPhone(""); setGuestEmail("");
    setServiceId(""); setStaffId("");
    setDate(prefillDate ?? ""); setSlots([]); setSelectedSlot(null);
    setNotes(""); setError(null);
  };

  if (!open) return null;

  const selectedService = formData?.services.find(s => s.id === serviceId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass rounded-2xl border border-border-gold shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-display text-2xl text-text-primary">New Booking</h2>
            <p className="text-text-muted text-xs mt-0.5">Admin · Instantly confirmed</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">✅</div>
            <p className="font-display text-2xl text-text-primary">Booking Created!</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">

            {/* ── Client ── */}
            <div>
              <p className="text-xs uppercase tracking-widest text-text-muted mb-3">Client</p>
              <div className="flex gap-2 mb-3">
                {(["existing", "walkin"] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                      mode === m
                        ? "bg-accent text-accent-foreground"
                        : "glass text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {m === "existing" ? "Existing Client" : "Walk-In / New"}
                  </button>
                ))}
              </div>

              {mode === "existing" ? (
                <div className="relative">
                  {selectedClient ? (
                    <div className="flex items-center justify-between glass-gold rounded-xl px-4 py-3">
                      <div>
                        <p className="text-text-primary font-medium">{selectedClient.full_name}</p>
                        <p className="text-text-muted text-xs">{selectedClient.email} {selectedClient.phone ? `· ${selectedClient.phone}` : ""}</p>
                      </div>
                      <button
                        onClick={() => { setSelectedClient(null); setClientQuery(""); }}
                        className="text-text-muted hover:text-text-primary text-sm"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Search by name, email, or phone…"
                        value={clientQuery}
                        onChange={e => handleClientSearch(e.target.value)}
                        className="w-full bg-surface-card border border-border-light rounded-xl px-4 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-gold"
                      />
                      {clientResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 glass rounded-xl border border-border-light overflow-hidden shadow-xl">
                          {clientResults.map(c => (
                            <button
                              key={c.id}
                              onClick={() => { setSelectedClient(c); setClientResults([]); setClientQuery(c.full_name); }}
                              className="w-full text-left px-4 py-2.5 hover:bg-surface-elevated transition-colors"
                            >
                              <p className="text-text-primary text-sm">{c.full_name}</p>
                              <p className="text-text-muted text-xs">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p>
                            </button>
                          ))}
                        </div>
                      )}
                      {clientQuery.length >= 2 && clientResults.length === 0 && (
                        <p className="text-text-muted text-xs mt-2 px-1">No clients found — switch to Walk-In to book without an account.</p>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Full name *"
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    className="w-full bg-surface-card border border-border-light rounded-xl px-4 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-gold"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={guestPhone}
                      onChange={e => setGuestPhone(e.target.value)}
                      className="w-full bg-surface-card border border-border-light rounded-xl px-4 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-gold"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={guestEmail}
                      onChange={e => setGuestEmail(e.target.value)}
                      className="w-full bg-surface-card border border-border-light rounded-xl px-4 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── Service ── */}
            <div>
              <p className="text-xs uppercase tracking-widest text-text-muted mb-3">Service</p>
              {!formData ? (
                <div className="glass rounded-xl px-4 py-3 text-text-muted text-sm">Loading…</div>
              ) : (
                <select
                  value={serviceId}
                  onChange={e => { setServiceId(e.target.value); setSelectedSlot(null); }}
                  className="w-full bg-surface-card border border-border-light rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-gold"
                >
                  <option value="">Select a service…</option>
                  {formData.services.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {fmt(s.price_cents)} · {s.duration_minutes}min
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* ── Staff ── */}
            <div>
              <p className="text-xs uppercase tracking-widest text-text-muted mb-3">Stylist</p>
              {!formData ? (
                <div className="glass rounded-xl px-4 py-3 text-text-muted text-sm">Loading…</div>
              ) : (
                <select
                  value={staffId}
                  onChange={e => { setStaffId(e.target.value); setSelectedSlot(null); }}
                  className="w-full bg-surface-card border border-border-light rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-gold"
                >
                  <option value="">Any Available</option>
                  {formData.staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* ── Date ── */}
            <div>
              <p className="text-xs uppercase tracking-widest text-text-muted mb-3">Date</p>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={e => { setDate(e.target.value); setSelectedSlot(null); }}
                className="w-full bg-surface-card border border-border-light rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-gold"
              />
            </div>

            {/* ── Time Slots ── */}
            {date && serviceId && (
              <div>
                <p className="text-xs uppercase tracking-widest text-text-muted mb-3">
                  Time {loadingSlots && <span className="text-text-muted normal-case tracking-normal ml-2">Loading…</span>}
                </p>
                {!loadingSlots && slots.length === 0 && (
                  <p className="text-text-muted text-sm">No available slots for this date.</p>
                )}
                <div className="grid grid-cols-4 gap-2">
                  {slots.map(slot => {
                    const selected = selectedSlot?.start === slot.start;
                    return (
                      <button
                        key={slot.start}
                        onClick={() => setSelectedSlot(slot)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          selected
                            ? "bg-accent text-accent-foreground"
                            : "glass text-text-secondary hover:text-text-primary hover:border-gold border border-transparent"
                        }`}
                      >
                        {fmtSlot(slot.start)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Notes ── */}
            <div>
              <p className="text-xs uppercase tracking-widest text-text-muted mb-3">Notes (optional)</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Service notes, special requests…"
                rows={2}
                className="w-full bg-surface-card border border-border-light rounded-xl px-4 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-gold resize-none"
              />
            </div>

            {/* ── Summary ── */}
            {selectedSlot && selectedService && (
              <div className="glass-gold rounded-xl p-4 text-sm space-y-1">
                <div className="flex justify-between text-text-secondary">
                  <span>Service</span>
                  <span className="text-text-primary">{selectedService.name}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Date & Time</span>
                  <span className="text-text-primary">
                    {new Date(selectedSlot.start).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/New_York" })} at {fmtSlot(selectedSlot.start)}
                  </span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Price</span>
                  <span className="text-text-primary">{fmt(selectedService.price_cents)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Status</span>
                  <span className="text-success">Confirmed</span>
                </div>
              </div>
            )}

            {error && (
              <p className="text-error text-sm px-1">{error}</p>
            )}

            {/* ── Actions ── */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 glass rounded-xl py-3 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-xl py-3 text-sm font-medium transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #D4A017, #F0C040)", color: "#1A1A2E" }}
              >
                {submitting ? "Creating…" : "Create Booking"}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
