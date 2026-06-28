"use client";

import { useState, useTransition } from "react";
import {
  type CampaignRow,
  createCampaign,
  updateCampaignStatus,
  deleteCampaign,
} from "@/actions/campaigns";

const SEGMENT_LABELS: Record<string, string> = {
  all: "All Clients",
  inactive_30_days: "Inactive 30+ Days",
  inactive_60_days: "Inactive 60+ Days",
  custom: "Custom",
};

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  imessage: "iMessage",
  all: "All Channels",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "text-text-muted border-border-light",
  approved: "text-gold border-border-gold",
  sent: "text-green-400 border-green-400/30",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function CampaignsAdmin({
  initialCampaigns,
}: {
  initialCampaigns: CampaignRow[];
}) {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>(initialCampaigns);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [createError, setCreateError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    subject: "",
    body_template: "",
    segment: "all",
    channel: "email",
  });

  function handleCreate() {
    setCreateError(null);
    startTransition(async () => {
      const result = await createCampaign(form);
      if (result.error) { setCreateError(result.error); return; }
      if (result.data) setCampaigns((prev) => [result.data!, ...prev]);
      setForm({ name: "", subject: "", body_template: "", segment: "all", channel: "email" });
      setShowCreate(false);
    });
  }

  function handleApprove(id: string) {
    startTransition(async () => {
      const { error } = await updateCampaignStatus(id, "approved");
      if (!error) {
        setCampaigns((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: "approved" } : c))
        );
      }
    });
  }

  function handleRevoke(id: string) {
    startTransition(async () => {
      const { error } = await updateCampaignStatus(id, "draft");
      if (!error) {
        setCampaigns((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: "draft" } : c))
        );
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this campaign?")) return;
    startTransition(async () => {
      const { error } = await deleteCampaign(id);
      if (!error) setCampaigns((prev) => prev.filter((c) => c.id !== id));
    });
  }

  return (
    <div className="space-y-6">
      {/* Create button */}
      {!showCreate ? (
        <button
          onClick={() => setShowCreate(true)}
          className="bg-accent text-accent-foreground rounded-full px-5 py-2.5 text-sm font-medium hover:bg-gold-light transition-colors"
        >
          + New Campaign
        </button>
      ) : (
        <div className="glass rounded-2xl p-6 space-y-4 max-w-2xl">
          <h2 className="text-text-primary font-medium">New Campaign</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-text-muted text-xs mb-1">Campaign Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Summer Glow Promo"
                className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-text-muted text-xs mb-1">Subject Line *</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Your crown deserves this treatment ✨"
                className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>

            <div>
              <label className="block text-text-muted text-xs mb-1">Audience Segment</label>
              <select
                value={form.segment}
                onChange={(e) => setForm((f) => ({ ...f, segment: e.target.value }))}
                className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
              >
                {Object.entries(SEGMENT_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-text-muted text-xs mb-1">Channel</label>
              <select
                value={form.channel}
                onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
                className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
              >
                {Object.entries(CHANNEL_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-text-muted text-xs mb-1">Message Body *</label>
              <textarea
                rows={5}
                value={form.body_template}
                onChange={(e) => setForm((f) => ({ ...f, body_template: e.target.value }))}
                placeholder="Hey {{name}}, we miss you at Crowns Enchanted…"
                className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold resize-none"
              />
              <p className="text-text-muted text-xs mt-1">Use {"{{name}}"} as a placeholder for the client's name.</p>
            </div>
          </div>

          {createError && <p className="text-error text-xs">{createError}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={isPending}
              className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save Draft"}
            </button>
            <button
              onClick={() => { setShowCreate(false); setCreateError(null); }}
              className="text-text-muted text-sm hover:text-text-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Campaign list */}
      {campaigns.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-text-muted">
          No campaigns yet. Create one to start reaching your clients.
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="glass rounded-xl overflow-hidden">
              <div
                className="px-5 py-4 flex items-center justify-between cursor-pointer"
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border uppercase tracking-widest shrink-0 ${STATUS_COLORS[c.status] ?? "text-text-muted border-border-light"}`}
                  >
                    {c.status}
                  </span>
                  <div className="min-w-0">
                    <p className="text-text-primary text-sm font-medium truncate">{c.name}</p>
                    <p className="text-text-muted text-xs truncate">{c.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0 ml-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-text-muted text-xs">{SEGMENT_LABELS[c.segment] ?? c.segment}</p>
                    <p className="text-text-muted text-xs">{CHANNEL_LABELS[c.channel] ?? c.channel}</p>
                  </div>
                  <div className="text-right">
                    {c.status === "sent" ? (
                      <p className="text-text-secondary text-xs">{c.sent_count} sent</p>
                    ) : (
                      <p className="text-text-muted text-xs">{fmtDate(c.created_at)}</p>
                    )}
                  </div>
                  <span className="text-text-muted text-xs">{expanded === c.id ? "▲" : "▼"}</span>
                </div>
              </div>

              {expanded === c.id && (
                <div className="px-5 pb-5 border-t border-border-light pt-4 space-y-4">
                  <div className="bg-surface rounded-lg p-4">
                    <p className="text-text-muted text-xs uppercase tracking-widest mb-2">Message</p>
                    <p className="text-text-secondary text-sm whitespace-pre-wrap">{c.body_template}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {c.status === "draft" && (
                      <button
                        onClick={() => handleApprove(c.id)}
                        disabled={isPending}
                        className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-xs font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    {c.status === "approved" && (
                      <button
                        onClick={() => handleRevoke(c.id)}
                        disabled={isPending}
                        className="border border-border-light text-text-secondary rounded-lg px-4 py-2 text-xs font-medium hover:border-border-gold hover:text-gold transition-colors disabled:opacity-50"
                      >
                        Revoke Approval
                      </button>
                    )}
                    {c.status !== "sent" && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={isPending}
                        className="text-error text-xs hover:opacity-80 transition-opacity disabled:opacity-40"
                      >
                        Delete
                      </button>
                    )}
                    {c.sent_at && (
                      <span className="text-text-muted text-xs ml-auto">
                        Sent {fmtDate(c.sent_at)} · {c.sent_count} recipients
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
