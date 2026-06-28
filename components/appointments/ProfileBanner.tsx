"use client";

import { useState, useTransition } from "react";
import { updateMyProfile } from "@/actions/profile";

interface Props {
  fullName: string;
  phone: string | null;
}

function isIncomplete(fullName: string, phone: string | null): boolean {
  // Auto-generated names look like email usernames (no spaces)
  const nameIsPlaceholder = !fullName || !fullName.includes(" ");
  return nameIsPlaceholder || !phone;
}

export default function ProfileBanner({ fullName, phone }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  if (dismissed || !isIncomplete(fullName, phone)) return null;

  function handleSave(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await updateMyProfile(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setDismissed(true), 1500);
      }
    });
  }

  if (saved) {
    return (
      <div className="mb-6 rounded-2xl px-5 py-4 border border-success/30 bg-success/10 flex items-center gap-3">
        <span className="text-success">✓</span>
        <p className="text-success text-sm font-medium">Profile updated!</p>
      </div>
    );
  }

  return (
    <div
      className="mb-6 rounded-2xl border overflow-hidden"
      style={{ borderColor: "rgba(212,160,23,0.3)", background: "rgba(212,160,23,0.06)" }}
    >
      {!editing ? (
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="shrink-0 w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center">
            <span className="text-gold text-base">👤</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gold text-sm font-medium">Complete your profile</p>
            <p className="text-text-muted text-xs mt-0.5">
              Add your name and phone so we can reach you about your appointments.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="rounded-full px-4 py-2 text-xs font-medium transition-all"
              style={{ background: "linear-gradient(135deg, #D4A017, #F0C040)", color: "#1A1A2E" }}
            >
              Update
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-text-muted text-xs hover:text-text-secondary transition-colors p-1"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <form action={handleSave} className="px-5 py-4">
          <p className="text-gold text-sm font-medium mb-4">Your profile</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-text-secondary text-xs font-medium block mb-1">Full name</label>
              <input
                name="full_name"
                type="text"
                defaultValue={fullName.includes(" ") ? fullName : ""}
                placeholder="First Last"
                required
                className="w-full bg-surface-card border border-border-light rounded-lg px-3 py-2.5 text-text-primary text-sm placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold"
              />
            </div>
            <div>
              <label className="text-text-secondary text-xs font-medium block mb-1">Phone number</label>
              <input
                name="phone"
                type="tel"
                defaultValue={phone ?? ""}
                placeholder="(770) 555-0100"
                className="w-full bg-surface-card border border-border-light rounded-lg px-3 py-2.5 text-text-primary text-sm placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold"
              />
            </div>
          </div>
          {error && <p className="text-error text-xs mb-3">{error}</p>}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full px-5 py-2 text-xs font-medium disabled:opacity-60 transition-all"
              style={{ background: "linear-gradient(135deg, #D4A017, #F0C040)", color: "#1A1A2E" }}
            >
              {isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-text-muted text-xs hover:text-text-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
