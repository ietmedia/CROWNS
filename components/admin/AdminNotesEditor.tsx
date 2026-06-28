"use client";

import { useState, useTransition } from "react";
import { updateClientAdminNotes } from "@/actions/admin";

export default function AdminNotesEditor({
  clientId,
  initialNotes,
}: {
  clientId: string;
  initialNotes: string | null;
}) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const result = await updateClientAdminNotes(clientId, notes);
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  return (
    <div className="space-y-2">
      <textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setSaved(false);
        }}
        rows={5}
        placeholder="Internal notes visible only to admin…"
        className="w-full bg-surface-card border border-border-light rounded-lg px-3 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold resize-none"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-accent text-accent-foreground rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save Notes"}
        </button>
        {saved && (
          <span className="text-success text-xs">Saved</span>
        )}
        {error && (
          <span className="text-error text-xs">{error}</span>
        )}
      </div>
    </div>
  );
}
