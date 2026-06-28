"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { insforge } from "@/lib/insforge-client";
import { generateSlots, formatTime } from "@/lib/utils";
import type { Service } from "@/types";

interface Props {
  service: Service;
  staffIdChoice: string;
  onSelect: (startTime: string, endTime: string) => void;
  onBack: () => void;
}

interface Settings {
  open_time: string;
  close_time: string;
  slot_interval_minutes: number;
}

export default function Step3DateTime({
  service,
  staffIdChoice,
  onSelect,
  onBack,
}: Props) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);
  const [bookedStarts, setBookedStarts] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Fetch salon settings once
  useEffect(() => {
    insforge.database
      .from("settings")
      .select("open_time, close_time, slot_interval_minutes")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setSettings(data as Settings);
      });
  }, []);

  // Fetch slots when date selected
  useEffect(() => {
    if (!selectedDate || !settings) return;
    setLoadingSlots(true);

    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const query = insforge.database
      .from("appointments")
      .select("start_time")
      .in("status", ["pending", "confirmed"])
      .gte("start_time", dayStart.toISOString())
      .lte("start_time", dayEnd.toISOString());

    if (staffIdChoice !== "any") {
      query.eq("staff_id", staffIdChoice);
    }

    query.then(({ data }) => {
      const booked = new Set(
        (data ?? []).map((a: { start_time: string }) => a.start_time)
      );
      setBookedStarts(booked);

      const generated = generateSlots(
        selectedDate,
        settings.open_time,
        settings.close_time,
        settings.slot_interval_minutes,
        service.duration_minutes
      );
      // Filter out past slots
      const now = new Date();
      const available = generated.filter((s) => new Date(s.start) > now);
      setSlots(available);
      setLoadingSlots(false);
    });
  }, [selectedDate, settings, staffIdChoice, service.duration_minutes]);

  const prevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  const nextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );

  const calendarDays = buildCalendarDays(currentMonth);
  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const isPastMonth =
    currentMonth.getFullYear() < today.getFullYear() ||
    (currentMonth.getFullYear() === today.getFullYear() &&
      currentMonth.getMonth() < today.getMonth());

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-text-secondary text-sm hover:text-gold transition-colors mb-8"
      >
        ← Back to staff
      </button>

      <div className="text-center mb-10">
        <p className="text-text-muted text-xs uppercase tracking-widest mb-2">
          {service.name}
        </p>
        <h2 className="font-display text-4xl text-text-primary mb-3">
          Pick a Date & Time
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={prevMonth}
              disabled={isPastMonth}
              className="text-text-muted hover:text-gold transition-colors disabled:opacity-30"
            >
              ‹
            </button>
            <span className="text-text-primary font-medium text-sm">{monthLabel}</span>
            <button
              onClick={nextMonth}
              className="text-text-muted hover:text-gold transition-colors"
            >
              ›
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div
                key={d}
                className="text-center text-xs text-text-muted font-medium py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {calendarDays.map((day, i) => {
              if (!day) {
                return <div key={`empty-${i}`} />;
              }
              const dateStr = toDateStr(day);
              const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === toDateStr(today);

              return (
                <button
                  key={dateStr}
                  onClick={() => !isPast && setSelectedDate(dateStr)}
                  disabled={isPast}
                  className={`aspect-square flex items-center justify-center text-sm rounded-full transition-all duration-150 ${
                    isSelected
                      ? "bg-accent text-accent-foreground font-medium"
                      : isToday
                      ? "border border-border-gold text-gold"
                      : isPast
                      ? "text-text-muted/30 cursor-not-allowed"
                      : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots */}
        <div>
          {!selectedDate ? (
            <div className="glass rounded-2xl p-8 flex items-center justify-center h-full">
              <p className="text-text-muted text-sm text-center">
                Select a date to see available times
              </p>
            </div>
          ) : loadingSlots ? (
            <div className="glass rounded-2xl p-8 flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          ) : slots.length === 0 ? (
            <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center h-full gap-3">
              <p className="text-text-muted text-sm text-center">
                No available times on this date.
              </p>
              <p className="text-text-muted text-xs text-center">
                Try a different day.
              </p>
            </div>
          ) : (
            <div className="glass rounded-2xl p-6">
              <p className="text-text-secondary text-sm font-medium mb-4">
                Available times ·{" "}
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                {slots.map((slot) => {
                  const isBooked = bookedStarts.has(slot.start);
                  return (
                    <motion.button
                      key={slot.start}
                      whileHover={!isBooked ? { scale: 1.03 } : undefined}
                      whileTap={!isBooked ? { scale: 0.97 } : undefined}
                      disabled={isBooked}
                      onClick={() => !isBooked && onSelect(slot.start, slot.end)}
                      className={`py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isBooked
                          ? "bg-surface-card text-text-muted/40 cursor-not-allowed"
                          : "border border-border-light text-text-secondary hover:border-border-gold hover:text-gold hover:glass-gold"
                      }`}
                    >
                      {formatTime(slot.start)}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildCalendarDays(firstOfMonth: Date): (Date | null)[] {
  const year = firstOfMonth.getFullYear();
  const month = firstOfMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();

  const days: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
  return days;
}
