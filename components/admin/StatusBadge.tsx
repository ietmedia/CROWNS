const STYLES: Record<string, string> = {
  pending:   "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  confirmed: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  completed: "bg-green-500/20 text-green-300 border-green-500/30",
  cancelled: "bg-white/10 text-white/40 border-white/10",
  no_show:   "bg-red-500/20 text-red-400 border-red-500/30",
};

const LABELS: Record<string, string> = {
  pending:   "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show:   "No-Show",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${
        STYLES[status] ?? "bg-white/10 text-white/40 border-white/10"
      }`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
