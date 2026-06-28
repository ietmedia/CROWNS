"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getMyAppointments, cancelAppointment } from "@/actions/appointments";
import { formatCents, formatDateTime } from "@/lib/utils";
import ReviewForm from "./ReviewForm";

type Tab = "upcoming" | "past";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-gold/15 text-gold",
  confirmed: "bg-success/15 text-success",
  completed: "bg-teal/15 text-teal",
  cancelled: "bg-error/15 text-error",
  no_show: "bg-white/10 text-text-muted",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

interface ServiceRow {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  deposit_cents: number;
}

interface StaffRow {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
}

interface IntakeFormStatus {
  id: string;
  signed_at: string | null;
}

interface Appointment {
  id: string;
  status: string;
  payment_status: string;
  start_time: string;
  end_time: string;
  intake_notes: string | null;
  created_at: string;
  services: ServiceRow | ServiceRow[] | null;
  staff: StaffRow | StaffRow[] | null;
  reviews: { id: string }[] | null;
  intake_forms: IntakeFormStatus | IntakeFormStatus[] | null;
}

function getService(a: Appointment): ServiceRow | null {
  if (!a.services) return null;
  return Array.isArray(a.services) ? a.services[0] ?? null : a.services;
}

function getStaff(a: Appointment): StaffRow | null {
  if (!a.staff) return null;
  return Array.isArray(a.staff) ? a.staff[0] ?? null : a.staff;
}

function getIntakeForm(a: Appointment): IntakeFormStatus | null {
  if (!a.intake_forms) return null;
  return Array.isArray(a.intake_forms) ? a.intake_forms[0] ?? null : a.intake_forms;
}

function needsIntake(appt: Appointment): boolean {
  if (!["pending", "confirmed"].includes(appt.status)) return false;
  if (new Date(appt.start_time) <= new Date()) return false;
  const form = getIntakeForm(appt);
  return !form || !form.signed_at;
}

export default function AppointmentsList() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<Record<string, string>>({});
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getMyAppointments().then(({ data }) => {
      const appts = (data as unknown as Appointment[]) ?? [];
      setAppointments(appts);
      // Seed reviewedIds from any appointments that already have a review
      const alreadyReviewed = new Set<string>();
      for (const a of appts) {
        if (a.reviews && a.reviews.length > 0) alreadyReviewed.add(a.id);
      }
      setReviewedIds(alreadyReviewed);
      setLoading(false);
    });
  }, []);

  const now = new Date();
  const upcoming = appointments.filter(
    (a) => new Date(a.start_time) >= now && !["cancelled", "no_show"].includes(a.status)
  );
  const past = appointments.filter(
    (a) => new Date(a.start_time) < now || ["cancelled", "no_show", "completed"].includes(a.status)
  );

  const visible = tab === "upcoming" ? upcoming : past;

  function handleCancel(id: string) {
    setCancellingId(null);
    setCancelError({});
    startTransition(async () => {
      const result = await cancelAppointment(id, "Client cancelled");
      if (result?.error) {
        setCancelError((prev) => ({ ...prev, [id]: result.error! }));
      } else {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))
        );
      }
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex rounded-full border border-border-light p-1 max-w-xs mb-8">
        {(["upcoming", "past"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
              tab === t
                ? "bg-accent text-accent-foreground"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {t === "upcoming"
              ? `Upcoming (${upcoming.length})`
              : `Past (${past.length})`}
          </button>
        ))}
      </div>

      {/* List */}
      <AnimatePresence mode="wait">
        {visible.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <p className="text-text-muted text-sm mb-4">
              {tab === "upcoming"
                ? "No upcoming appointments."
                : "No past appointments yet."}
            </p>
            {tab === "upcoming" && (
              <Link
                href="/book"
                className="bg-accent text-accent-foreground rounded-full px-6 py-3 text-sm font-medium hover:bg-gold-light transition-colors"
              >
                Book an Appointment
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {visible.map((appt) => {
              const canCancel =
                tab === "upcoming" &&
                ["pending", "confirmed"].includes(appt.status) &&
                !isPending;

              return (
                <div key={appt.id} className="glass rounded-2xl p-6">
                  <div className="flex items-start justify-between gap-4">
                    {(() => {
                      const svc = getService(appt);
                      const stf = getStaff(appt);
                      return (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-display text-xl text-text-primary">
                                {svc?.name ?? "Appointment"}
                              </h3>
                              <span
                                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                  STATUS_STYLES[appt.status] ?? "bg-white/10 text-text-muted"
                                }`}
                              >
                                {STATUS_LABELS[appt.status] ?? appt.status}
                              </span>
                            </div>
                            <p className="text-text-secondary text-sm">
                              {formatDateTime(appt.start_time)}
                            </p>
                            {stf && (
                              <p className="text-text-muted text-xs mt-1">
                                with {stf.name}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            {svc && (
                              <p className="text-gold text-sm font-medium">
                                {formatCents(svc.price_cents)}
                              </p>
                            )}
                            {svc && (
                              <p className="text-text-muted text-xs">
                                {svc.duration_minutes} min
                              </p>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {cancelError[appt.id] && (
                    <p className="text-error text-xs mt-3">
                      {cancelError[appt.id]}
                    </p>
                  )}

                  {/* Intake form prompt */}
                  {needsIntake(appt) && (
                    <div className="mt-4 pt-4 border-t border-border-light">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-gold text-xs font-medium">Beauty Consultation Required</p>
                          <p className="text-text-muted text-xs mt-0.5">
                            Complete your intake form so your stylist can prepare for your visit.
                          </p>
                        </div>
                        <Link
                          href={`/intake/${appt.id}`}
                          className="shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-all"
                          style={{ background: "linear-gradient(135deg, #D4A017, #F0C040)", color: "#1A1A2E" }}
                        >
                          Fill Out Form →
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Intake form complete confirmation */}
                  {!needsIntake(appt) && ["pending", "confirmed"].includes(appt.status) && new Date(appt.start_time) > new Date() && getIntakeForm(appt)?.signed_at && (
                    <div className="mt-4 pt-4 border-t border-border-light">
                      <p className="text-success text-xs">✓ Intake form submitted</p>
                    </div>
                  )}

                  {canCancel && (
                    <div className="mt-4 pt-4 border-t border-border-light">
                      {cancellingId === appt.id ? (
                        <div className="flex items-center gap-3">
                          <p className="text-text-secondary text-xs flex-1">
                            Are you sure you want to cancel?
                          </p>
                          <button
                            onClick={() => handleCancel(appt.id)}
                            className="text-error text-xs font-medium hover:opacity-80 transition-opacity"
                          >
                            Yes, cancel
                          </button>
                          <button
                            onClick={() => setCancellingId(null)}
                            className="text-text-muted text-xs hover:text-text-secondary transition-colors"
                          >
                            Keep it
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCancellingId(appt.id)}
                          className="text-text-muted text-xs hover:text-error transition-colors"
                        >
                          Cancel appointment
                        </button>
                      )}
                    </div>
                  )}

                  {/* Review prompt for completed past appointments */}
                  {tab === "past" &&
                    appt.status === "completed" &&
                    !reviewedIds.has(appt.id) && (() => {
                      const svc = getService(appt);
                      const stf = getStaff(appt);
                      if (!svc || !stf) return null;
                      return (
                        <ReviewForm
                          appointmentId={appt.id}
                          staffId={stf.id}
                          serviceId={svc.id}
                          onSuccess={() =>
                            setReviewedIds((prev) => new Set([...prev, appt.id]))
                          }
                        />
                      );
                    })()}

                  {tab === "past" &&
                    appt.status === "completed" &&
                    reviewedIds.has(appt.id) && (
                      <div className="mt-4 pt-4 border-t border-border-light">
                        <p className="text-text-muted text-xs">Review submitted — thank you!</p>
                      </div>
                    )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
