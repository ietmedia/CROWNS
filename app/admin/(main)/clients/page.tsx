import Link from "next/link";
import { getClients } from "@/actions/admin";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  imessage: "iMessage",
};

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = parseInt(sp.page ?? "1", 10);

  const { data, total, totalPages } = await getClients({
    search: sp.search,
    page,
  });

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { search: sp.search, page: sp.page, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    return `/admin/clients?${params.toString()}`;
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-text-primary mb-1">Clients</h1>
      <p className="text-text-secondary text-sm mb-8">
        {total} client{total !== 1 ? "s" : ""}
      </p>

      {/* Search */}
      <form
        method="get"
        action="/admin/clients"
        className="glass rounded-xl p-4 mb-6 flex gap-3"
      >
        <input
          name="search"
          type="text"
          defaultValue={sp.search ?? ""}
          placeholder="Search by name, email, or phone…"
          className="flex-1 bg-surface-card border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold"
        />
        <button
          type="submit"
          className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-gold-light transition-colors"
        >
          Search
        </button>
        {sp.search && (
          <Link
            href="/admin/clients"
            className="glass rounded-lg px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        {data.length === 0 ? (
          <p className="text-text-muted text-sm px-6 py-10 text-center">
            {sp.search ? `No clients match "${sp.search}".` : "No clients yet."}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {["Name", "Email", "Phone", "Preferred Channel", "Joined"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-text-muted text-xs uppercase tracking-widest font-normal"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-surface-elevated transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/clients/${client.id}`}
                          className="text-text-primary hover:text-gold transition-colors font-medium"
                        >
                          {client.full_name || "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {client.email || "—"}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {client.phone ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs">
                        {CHANNEL_LABELS[client.preferred_channel] ?? client.preferred_channel}
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">
                        {fmtDate(client.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-text-muted text-xs">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={buildUrl({ page: String(page - 1) })}
                      className="glass px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary text-xs transition-colors"
                    >
                      ← Prev
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={buildUrl({ page: String(page + 1) })}
                      className="glass px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary text-xs transition-colors"
                    >
                      Next →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
