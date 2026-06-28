import { getWeekAppointments } from "@/actions/admin";
import WeekCalendar from "@/components/admin/WeekCalendar";

function getThisMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const weekStart = week ?? getThisMonday();

  const { data: appointments } = await getWeekAppointments(weekStart);

  return (
    <div>
      <h1 className="font-display text-4xl text-text-primary mb-1">Calendar</h1>
      <p className="text-text-secondary text-sm mb-8">
        Weekly appointment view
      </p>
      <WeekCalendar
        weekStart={weekStart}
        appointments={appointments as unknown as Parameters<typeof WeekCalendar>[0]["appointments"]}
      />
    </div>
  );
}
