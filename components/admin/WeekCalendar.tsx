"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "./StatusBadge";
import AdminCreateBookingModal from "./AdminCreateBookingModal";

type CalendarAppt = {
  id: string;
  status: string;
  start_time: string;
  end_time: string;
  guest_name?: string | null;
  clients: { id: string; full_name: string } | null;
  staff: { id: string; name: string } | null;
  services: { id: string; name: string; duration_minutes: number } | null;
};

const STATUS_COLORS: Record<string, string> = {
  pending:   "border-l-yellow-400 bg-yellow-400/10",
  confirmed: "border-l-teal-400 bg-teal-400/10",
  completed: "border-l-green-400 bg-green-400/10",
  cancelled: "border-l-white/20 bg-white/5",
  no_show:   "border-l-red-400 bg-red-400/10",
};

// Time slots: 09:00 to 18:00 in 30-min increments
const SLOT_COUNT = 18; // 9*2 slots from 9am to 6pm
const SLOT_MINUTES = 30;
const DAY_START_HOUR = 9;

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtSlotLabel(slotIndex: number): string {
  const totalMins = DAY_START_HOUR * 60 + slotIndex * SLOT_MINUTES;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h > 12 ? h - 12 : h;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, "0")}${ampm}`;
}

function fmtDayHeader(date: Date): { weekday: string; date: string } {
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
    date: date.toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
  };
}

function getApptPosition(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const startMins = start.getHours() * 60 + start.getMinutes() - DAY_START_HOUR * 60;
  const endMins = end.getHours() * 60 + end.getMinutes() - DAY_START_HOUR * 60;
  const slotH = 48; // px per 30-min slot
  const top = (startMins / SLOT_MINUTES) * slotH;
  const height = Math.max(((endMins - startMins) / SLOT_MINUTES) * slotH, slotH);
  return { top, height };
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

export default function WeekCalendar({
  weekStart,
  appointments,
}: {
  weekStart: string;
  appointments: CalendarAppt[];
}) {
  const router = useRouter();
  const [monday, setMonday] = useState(() => {
    const d = new Date(weekStart + "T00:00:00");
    return getMonday(d);
  });
  const [bookingModal, setBookingModal] = useState<{ date: string; time: string } | null>(null);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });

  function navigate(dir: -1 | 1) {
    const next = new Date(monday);
    next.setDate(next.getDate() + dir * 7);
    setMonday(next);
    const iso = next.toISOString().slice(0, 10);
    router.push(`/admin/calendar?week=${iso}`);
  }

  // Group appointments by day index (0=Mon...6=Sun)
  const byDay: CalendarAppt[][] = Array.from({ length: 7 }, () => []);
  for (const appt of appointments) {
    const d = new Date(appt.start_time);
    const diff = Math.floor(
      (d.setHours(0, 0, 0, 0) - monday.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff >= 0 && diff < 7) {
      byDay[diff].push(appt);
    }
  }

  const totalGridH = SLOT_COUNT * 48;

  return (
    <div>
      {bookingModal && (
        <AdminCreateBookingModal
          open={true}
          onClose={() => setBookingModal(null)}
          prefillDate={bookingModal.date}
          prefillTime={bookingModal.time}
        />
      )}

      {/* Navigation + New Booking */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="glass px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary text-sm transition-colors"
        >
          ← Prev
        </button>
        <span className="text-text-primary font-medium">
          {monday.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(1)}
            className="glass px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary text-sm transition-colors"
          >
            Next →
          </button>
          <button
            onClick={() => {
              const today = new Date().toISOString().slice(0, 10);
              setBookingModal({ date: today, time: "T10:00:00" });
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: "linear-gradient(135deg, #D4A017, #F0C040)", color: "#1A1A2E" }}
          >
            + New Booking
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="glass rounded-xl overflow-hidden">
        {/* Day headers */}
        <div className="grid border-b border-border" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
          <div className="border-r border-border" />
          {days.map((day, i) => {
            const { weekday, date } = fmtDayHeader(day);
            return (
              <div
                key={i}
                className={`py-3 text-center border-r border-border last:border-r-0 ${
                  isToday(day) ? "bg-gold/5" : ""
                }`}
              >
                <p className={`text-xs uppercase tracking-widest ${isToday(day) ? "text-gold" : "text-text-muted"}`}>
                  {weekday}
                </p>
                <p className={`text-sm font-medium mt-0.5 ${isToday(day) ? "text-gold" : "text-text-secondary"}`}>
                  {date}
                </p>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div
          className="grid overflow-y-auto"
          style={{ gridTemplateColumns: "56px repeat(7, 1fr)", maxHeight: "560px" }}
        >
          {/* Time labels column */}
          <div className="border-r border-border relative" style={{ height: totalGridH }}>
            {Array.from({ length: SLOT_COUNT }, (_, i) => (
              <div
                key={i}
                className="absolute w-full flex items-start justify-end pr-2"
                style={{ top: i * 48, height: 48 }}
              >
                <span className="text-text-muted text-xs leading-none pt-1">
                  {fmtSlotLabel(i)}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, dayIdx) => (
            <div
              key={dayIdx}
              className={`relative border-r border-border last:border-r-0 ${
                isToday(day) ? "bg-gold/[0.02]" : ""
              }`}
              style={{ height: totalGridH }}
            >
              {/* Slot grid lines — clickable to create booking */}
              {Array.from({ length: SLOT_COUNT }, (_, i) => {
                const totalMins = DAY_START_HOUR * 60 + i * SLOT_MINUTES;
                const h = String(Math.floor(totalMins / 60)).padStart(2, "0");
                const m = String(totalMins % 60).padStart(2, "0");
                const slotTime = `T${h}:${m}:00`;
                const dateStr = day.toISOString().slice(0, 10);
                return (
                  <div
                    key={i}
                    className="absolute w-full border-t border-border/40 cursor-pointer hover:bg-gold/5 transition-colors group"
                    style={{ top: i * 48, height: 48 }}
                    onClick={() => setBookingModal({ date: dateStr, time: slotTime })}
                    title={`Book ${fmtSlotLabel(i)} on ${dateStr}`}
                  >
                    <span className="absolute right-1 top-1 text-text-muted text-xs opacity-0 group-hover:opacity-100 transition-opacity">+</span>
                  </div>
                );
              })}

              {/* Appointments */}
              {byDay[dayIdx].map((appt) => {
                const { top, height } = getApptPosition(
                  appt.start_time,
                  appt.end_time
                );
                return (
                  <div
                    key={appt.id}
                    className={`absolute left-0.5 right-0.5 rounded border-l-2 px-1.5 py-1 overflow-hidden ${
                      STATUS_COLORS[appt.status] ?? "border-l-white/20 bg-white/5"
                    }`}
                    style={{ top, height, zIndex: 10 }}
                    title={`${appt.clients?.full_name ?? appt.guest_name ?? "Walk-in"} — ${appt.services?.name}`}
                  >
                    <p className="text-text-primary text-xs font-medium truncate leading-tight">
                      {appt.clients?.full_name ?? appt.guest_name ?? "Walk-in"}
                    </p>
                    {height > 36 && (
                      <p className="text-text-muted text-xs truncate leading-tight">
                        {appt.services?.name}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 flex-wrap">
        {Object.entries({ pending: "Pending", confirmed: "Confirmed", completed: "Completed", no_show: "No-Show" }).map(
          ([s, label]) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded border-l-2 ${STATUS_COLORS[s]}`} />
              <span className="text-text-muted text-xs">{label}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
