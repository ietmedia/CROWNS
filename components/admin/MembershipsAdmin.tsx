"use client";

import { useState, useTransition } from "react";
import {
  type Membership,
  createMembership,
  updateMembership,
  toggleMembershipActive,
} from "@/actions/memberships";

type MembershipForm = {
  name: string;
  slug: string;
  description: string;
  price: string;
  billing_interval: string;
  features: string;
  stripe_price_id: string;
};

const BLANK: MembershipForm = {
  name: "",
  slug: "",
  description: "",
  price: "0.00",
  billing_interval: "monthly",
  features: "",
  stripe_price_id: "",
};

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function parseFeatures(s: string): string[] {
  return s.split("\n").map((f) => f.trim()).filter(Boolean);
}

function MembershipFormFields({
  form,
  onChange,
  isEdit,
}: {
  form: MembershipForm;
  onChange: (k: keyof MembershipForm, v: string) => void;
  isEdit: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="block text-text-muted text-xs mb-1">Tier Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => {
            onChange("name", e.target.value);
            if (!isEdit) onChange("slug", slugify(e.target.value));
          }}
          placeholder="e.g. Royal Beauty Society"
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      {!isEdit && (
        <div>
          <label className="block text-text-muted text-xs mb-1">Slug</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => onChange("slug", slugify(e.target.value))}
            placeholder="royal-beauty-society"
            className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>
      )}

      <div>
        <label className="block text-text-muted text-xs mb-1">Price ($)</label>
        <input
          type="number"
          min={0}
          step={0.01}
          value={form.price}
          onChange={(e) => onChange("price", e.target.value)}
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      <div>
        <label className="block text-text-muted text-xs mb-1">Billing Interval</label>
        <select
          value={form.billing_interval}
          onChange={(e) => onChange("billing_interval", e.target.value)}
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
        >
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
        </select>
      </div>

      <div>
        <label className="block text-text-muted text-xs mb-1">Stripe Price ID</label>
        <input
          type="text"
          value={form.stripe_price_id}
          onChange={(e) => onChange("stripe_price_id", e.target.value)}
          placeholder="price_…"
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-text-muted text-xs mb-1">Description</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="One-line description shown on the membership page"
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-text-muted text-xs mb-1">
          Features <span className="text-text-muted">(one per line)</span>
        </label>
        <textarea
          value={form.features}
          onChange={(e) => onChange("features", e.target.value)}
          rows={4}
          placeholder={"1 service/month\nPriority booking\n10% retail discount"}
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold resize-none"
        />
      </div>
    </div>
  );
}

export default function MembershipsAdmin({
  initialMemberships,
}: {
  initialMemberships: Membership[];
}) {
  const [memberships, setMemberships] = useState<Membership[]>(initialMemberships);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<MembershipForm>({ ...BLANK });
  const [addError, setAddError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MembershipForm>({ ...BLANK });
  const [editError, setEditError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<Record<string, string>>({});

  function patchAdd(k: keyof MembershipForm, v: string) {
    setAddForm((p) => ({ ...p, [k]: v }));
  }
  function patchEdit(k: keyof MembershipForm, v: string) {
    setEditForm((p) => ({ ...p, [k]: v }));
  }

  function handleAdd() {
    setAddError(null);
    startTransition(async () => {
      const result = await createMembership({
        name: addForm.name,
        slug: addForm.slug,
        description: addForm.description,
        price_cents: Math.round(parseFloat(addForm.price || "0") * 100),
        billing_interval: addForm.billing_interval,
        features: parseFeatures(addForm.features),
        stripe_price_id: addForm.stripe_price_id,
      });
      if (result.error) { setAddError(result.error); return; }
      setMemberships((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: addForm.name,
          slug: addForm.slug,
          description: addForm.description,
          price_cents: Math.round(parseFloat(addForm.price || "0") * 100),
          billing_interval: addForm.billing_interval,
          features: parseFeatures(addForm.features),
          stripe_price_id: addForm.stripe_price_id || null,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ]);
      setAddForm({ ...BLANK });
      setShowAdd(false);
    });
  }

  function startEdit(m: Membership) {
    setEditingId(m.id);
    setEditForm({
      name: m.name,
      slug: m.slug,
      description: m.description,
      price: (m.price_cents / 100).toFixed(2),
      billing_interval: m.billing_interval,
      features: m.features.join("\n"),
      stripe_price_id: m.stripe_price_id ?? "",
    });
    setEditError(null);
  }

  function handleEdit(id: string) {
    setEditError(null);
    startTransition(async () => {
      const result = await updateMembership(id, {
        name: editForm.name,
        description: editForm.description,
        price_cents: Math.round(parseFloat(editForm.price || "0") * 100),
        billing_interval: editForm.billing_interval,
        features: parseFeatures(editForm.features),
        stripe_price_id: editForm.stripe_price_id,
      });
      if (result.error) { setEditError(result.error); return; }
      setMemberships((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                name: editForm.name,
                description: editForm.description,
                price_cents: Math.round(parseFloat(editForm.price || "0") * 100),
                billing_interval: editForm.billing_interval,
                features: parseFeatures(editForm.features),
                stripe_price_id: editForm.stripe_price_id || null,
              }
            : m
        )
      );
      setEditingId(null);
    });
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleMembershipActive(id, !current);
      if (result.error) {
        setActionError((p) => ({ ...p, [id]: result.error! }));
        return;
      }
      setMemberships((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_active: !current } : m))
      );
    });
  }

  return (
    <div className="space-y-4">
      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="bg-accent text-accent-foreground rounded-full px-5 py-2.5 text-sm font-medium hover:bg-gold-light transition-colors"
        >
          + Add Tier
        </button>
      ) : (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-text-primary font-medium mb-4">New Membership Tier</h2>
          <MembershipFormFields form={addForm} onChange={patchAdd} isEdit={false} />
          {addError && <p className="text-error text-xs mt-3">{addError}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={handleAdd} disabled={isPending}
              className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50">
              {isPending ? "Saving…" : "Create Tier"}
            </button>
            <button onClick={() => { setShowAdd(false); setAddError(null); }}
              className="text-text-muted text-sm hover:text-text-secondary transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {memberships.map((m) => (
          <div key={m.id} className={`glass rounded-2xl p-6 ${!m.is_active ? "opacity-60" : ""}`}>
            {editingId === m.id ? (
              <>
                <MembershipFormFields form={editForm} onChange={patchEdit} isEdit />
                {editError && <p className="text-error text-xs mt-3">{editError}</p>}
                <div className="flex gap-3 mt-4">
                  <button onClick={() => handleEdit(m.id)} disabled={isPending}
                    className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50">
                    {isPending ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => setEditingId(null)}
                    className="text-text-muted text-sm hover:text-text-secondary transition-colors">
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display text-xl text-text-primary">{m.name}</h3>
                    <p className="text-gold text-sm font-medium">
                      {fmt(m.price_cents)}/{m.billing_interval === "quarterly" ? "qtr" : "mo"}
                    </p>
                  </div>
                  {!m.is_active && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-error/15 text-error">Inactive</span>
                  )}
                </div>
                {m.description && (
                  <p className="text-text-secondary text-sm mb-3">{m.description}</p>
                )}
                {m.features.length > 0 && (
                  <ul className="space-y-1 mb-4">
                    {m.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-text-secondary text-xs">
                        <span className="text-gold mt-0.5">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {m.stripe_price_id && (
                  <p className="text-text-muted text-xs mb-3">
                    Stripe: <code>{m.stripe_price_id}</code>
                  </p>
                )}
                <div className="flex items-center gap-3 pt-3 border-t border-border-light">
                  <button onClick={() => startEdit(m)}
                    className="text-text-secondary text-xs hover:text-text-primary transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleToggle(m.id, m.is_active)} disabled={isPending}
                    className="text-text-secondary text-xs hover:text-text-primary transition-colors disabled:opacity-50">
                    {m.is_active ? "Deactivate" : "Activate"}
                  </button>
                  {actionError[m.id] && (
                    <span className="text-error text-xs">{actionError[m.id]}</span>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
