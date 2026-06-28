"use client";

import { useState, useTransition } from "react";
import { updateAppointmentStatus, chargeNoShow } from "@/actions/admin";
import StatusBadge from "./StatusBadge";

const TRANSITIONS: Record<string, { label: string; next: string }[]> = {
  pending:   [{ label: "Confirm", next: "confirmed" }, { label: "Cancel", next: "cancelled" }],
  confirmed: [{ label: "Complete", next: "completed" }, { label: "No-Show", next: "no_show" }, { label: "Cancel", next: "cancelled" }],
  completed: [],
  cancelled: [],
  no_show:   [],
};

export default function StatusUpdater({
  appointmentId,
  status,
}: {
  appointmentId: string;
  status: string;
}) {
  const [current, setCurrent] = useState(status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const actions = TRANSITIONS[current] ?? [];

  function handleUpdate(next: string) {
    setError(null);
    startTransition(async () => {
      const result =
        next === "no_show"
          ? await chargeNoShow(appointmentId)
          : await updateAppointmentStatus(appointmentId, next);

      if (result.error) {
        setError(result.error);
      } else {
        setCurrent(next);
      }
    });
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <StatusBadge status={current} />
      {actions.map(({ label, next }) => (
        <button
          key={next}
          disabled={isPending}
          onClick={() => handleUpdate(next)}
          className={`text-xs px-2.5 py-1 rounded-full border transition-all disabled:opacity-50 ${
            next === "no_show"
              ? "border-red-500/40 text-red-400 hover:bg-red-500/10"
              : next === "cancelled"
              ? "border-white/20 text-white/50 hover:bg-white/5"
              : "border-gold/40 text-gold hover:bg-gold/10"
          }`}
        >
          {isPending ? "…" : label}
        </button>
      ))}
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  );
}
