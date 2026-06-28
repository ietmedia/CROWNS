"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { createBrowserClient } from "@insforge/sdk/ssr";
import {
  type StaffRow,
  createStaff,
  updateStaff,
  toggleStaffActive,
  updateStaffAvatar,
} from "@/actions/staff";

const ROLES = ["stylist", "colorist", "nail_tech", "esthetician", "other"] as const;

const ROLE_LABELS: Record<string, string> = {
  stylist: "Stylist",
  colorist: "Colorist",
  nail_tech: "Nail Tech",
  esthetician: "Esthetician",
  other: "Other",
};

const BLANK_FORM = {
  name: "",
  role: "stylist",
  bio: "",
  commission_rate: 0.4,
};

type FormState = typeof BLANK_FORM;

function commissionDisplay(rate: number) {
  return (rate * 100).toFixed(0);
}

function StaffFormFields({
  form,
  onChange,
}: {
  form: FormState;
  onChange: (k: keyof FormState, v: string | number) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="block text-text-muted text-xs mb-1">Full Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="e.g. Alicia Johnson"
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      <div>
        <label className="block text-text-muted text-xs mb-1">Role</label>
        <select
          value={form.role}
          onChange={(e) => onChange("role", e.target.value)}
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-text-muted text-xs mb-1">Commission Rate (%)</label>
        <input
          type="number"
          min={0}
          max={100}
          step={1}
          defaultValue={commissionDisplay(form.commission_rate)}
          onBlur={(e) =>
            onChange("commission_rate", parseFloat(e.target.value || "0") / 100)
          }
          key={`comm-${form.commission_rate}`}
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-text-muted text-xs mb-1">Bio</label>
        <textarea
          value={form.bio}
          onChange={(e) => onChange("bio", e.target.value)}
          rows={3}
          placeholder="Short bio shown on the booking page…"
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold resize-none"
        />
      </div>
    </div>
  );
}

function AvatarUploader({
  staff,
  onUpdate,
}: {
  staff: StaffRow;
  onUpdate: (id: string, url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const insforge = createBrowserClient();
    const { data, error: storageError } = await insforge.storage
      .from("avatars")
      .uploadAuto(file);

    if (storageError || !data) {
      setError("Upload failed.");
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const result = await updateStaffAvatar(staff.id, data.url);
    if (result.error) {
      setError(result.error);
    } else {
      onUpdate(staff.id, data.url);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <label className="relative cursor-pointer group shrink-0">
      {staff.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={staff.avatar_url}
          alt={staff.name}
          className="w-14 h-14 rounded-full object-cover border-2 border-border-light group-hover:border-gold transition-colors"
        />
      ) : (
        <div className="w-14 h-14 rounded-full bg-surface-elevated border-2 border-dashed border-border-light group-hover:border-gold transition-colors flex items-center justify-center">
          {uploading ? (
            <span className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          ) : (
            <span className="text-text-muted text-xl">+</span>
          )}
        </div>
      )}
      {staff.avatar_url && uploading && (
        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleUpload}
        disabled={uploading}
      />
      {error && (
        <p className="absolute top-full left-0 mt-1 text-error text-xs whitespace-nowrap">
          {error}
        </p>
      )}
    </label>
  );
}

export default function StaffManager({
  initialStaff,
}: {
  initialStaff: StaffRow[];
}) {
  const [staff, setStaff] = useState<StaffRow[]>(initialStaff);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<FormState>({ ...BLANK_FORM });
  const [addError, setAddError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>({ ...BLANK_FORM });
  const [editError, setEditError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<Record<string, string>>({});

  function patchAdd(k: keyof FormState, v: string | number) {
    setAddForm((p) => ({ ...p, [k]: v }));
  }
  function patchEdit(k: keyof FormState, v: string | number) {
    setEditForm((p) => ({ ...p, [k]: v }));
  }

  function handleAvatarUpdate(id: string, url: string) {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, avatar_url: url } : s)));
  }

  function handleAdd() {
    setAddError(null);
    startTransition(async () => {
      const result = await createStaff(addForm);
      if (result.error) { setAddError(result.error); return; }
      setStaff((prev) => [
        ...prev,
        {
          ...addForm,
          id: crypto.randomUUID(),
          bio: addForm.bio || null,
          avatar_url: null,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ]);
      setAddForm({ ...BLANK_FORM });
      setShowAdd(false);
    });
  }

  function startEdit(member: StaffRow) {
    setEditingId(member.id);
    setEditForm({
      name: member.name,
      role: member.role,
      bio: member.bio ?? "",
      commission_rate: Number(member.commission_rate),
    });
    setEditError(null);
  }

  function handleEdit(id: string) {
    setEditError(null);
    startTransition(async () => {
      const result = await updateStaff(id, editForm);
      if (result.error) { setEditError(result.error); return; }
      setStaff((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, ...editForm, bio: editForm.bio || null }
            : s
        )
      );
      setEditingId(null);
    });
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleStaffActive(id, !current);
      if (result.error) {
        setActionError((p) => ({ ...p, [id]: result.error! }));
        return;
      }
      setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: !current } : s)));
    });
  }

  return (
    <div className="space-y-4">
      {/* Add form */}
      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="bg-accent text-accent-foreground rounded-full px-5 py-2.5 text-sm font-medium hover:bg-gold-light transition-colors"
        >
          + Add Staff Member
        </button>
      ) : (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-text-primary font-medium mb-4">New Staff Member</h2>
          <StaffFormFields form={addForm} onChange={patchAdd} />
          {addError && <p className="text-error text-xs mt-3">{addError}</p>}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleAdd}
              disabled={isPending}
              className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Add Member"}
            </button>
            <button
              onClick={() => { setShowAdd(false); setAddError(null); }}
              className="text-text-muted text-sm hover:text-text-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Staff list */}
      {staff.length === 0 && (
        <p className="text-text-muted text-sm text-center py-12">No staff members yet.</p>
      )}

      {staff.map((member) => (
        <div
          key={member.id}
          className={`glass rounded-2xl p-6 ${!member.is_active ? "opacity-60" : ""}`}
        >
          {editingId === member.id ? (
            <>
              <StaffFormFields form={editForm} onChange={patchEdit} />
              {editError && <p className="text-error text-xs mt-3">{editError}</p>}
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => handleEdit(member.id)}
                  disabled={isPending}
                  className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
                >
                  {isPending ? "Saving…" : "Save Changes"}
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-text-muted text-sm hover:text-text-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-4">
                <AvatarUploader staff={member} onUpdate={handleAvatarUpdate} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-display text-xl text-text-primary">{member.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-text-muted">
                      {ROLE_LABELS[member.role] ?? member.role}
                    </span>
                    {!member.is_active && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-error/15 text-error">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-text-muted text-xs">
                    {commissionDisplay(Number(member.commission_rate))}% commission
                  </p>
                  {member.bio && (
                    <p className="text-text-secondary text-sm mt-1 line-clamp-2">{member.bio}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border-light">
                <Link
                  href={`/admin/staff/${member.id}`}
                  className="text-text-secondary text-xs hover:text-text-primary transition-colors"
                >
                  View Profile
                </Link>
                <button
                  onClick={() => startEdit(member)}
                  className="text-text-secondary text-xs hover:text-text-primary transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggle(member.id, member.is_active)}
                  disabled={isPending}
                  className="text-text-secondary text-xs hover:text-text-primary transition-colors disabled:opacity-50"
                >
                  {member.is_active ? "Deactivate" : "Activate"}
                </button>
                {actionError[member.id] && (
                  <span className="text-error text-xs">{actionError[member.id]}</span>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
