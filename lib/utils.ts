export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} at ${formatTime(iso)}`;
}

/** Generate bookable time slots for a given date, open/close times, and interval. */
export function generateSlots(
  date: string,
  openTime: string,
  closeTime: string,
  intervalMinutes: number,
  durationMinutes: number
): { start: string; end: string }[] {
  const [openH, openM] = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);

  // Parse as local date (not UTC) to avoid off-by-one-day in non-UTC timezones
  const [y, mo, d] = date.split("-").map(Number);
  const slots: { start: string; end: string }[] = [];

  let current = new Date(y, mo - 1, d, openH, openM, 0, 0);
  const close = new Date(y, mo - 1, d, closeH, closeM, 0, 0);

  while (true) {
    const end = new Date(current.getTime() + durationMinutes * 60_000);
    if (end > close) break;
    slots.push({ start: current.toISOString(), end: end.toISOString() });
    current = new Date(current.getTime() + intervalMinutes * 60_000);
  }

  return slots;
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
