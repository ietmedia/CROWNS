"use client";

import { useState, useTransition, useRef } from "react";
import { createBrowserClient } from "@insforge/sdk/ssr";
import {
  type ServiceRow,
  createService,
  updateService,
  toggleServiceActive,
  deleteService,
  addServiceImage,
  removeServiceImage,
} from "@/actions/services";

const CATEGORIES = ["hair", "color", "nails", "skin", "other"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  hair: "Hair",
  color: "Color",
  nails: "Nails",
  skin: "Skin",
  other: "Other",
};

const BLANK_FORM = {
  name: "",
  category: "hair",
  description: "",
  duration_minutes: 60,
  price_cents: 0,
  deposit_cents: 0,
};

type FormState = typeof BLANK_FORM;

function centsToDisplay(cents: number) {
  return (cents / 100).toFixed(2);
}

function displayToCents(val: string) {
  return Math.round(parseFloat(val || "0") * 100);
}

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

// ─── Service Form ─────────────────────────────────────────────────────────────

function ServiceFormFields({
  form,
  onChange,
}: {
  form: FormState;
  onChange: (k: keyof FormState, v: string | number) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="block text-text-muted text-xs mb-1">Service Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="e.g. Scalp Rehab"
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      <div>
        <label className="block text-text-muted text-xs mb-1">Category</label>
        <select
          value={form.category}
          onChange={(e) => onChange("category", e.target.value)}
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-text-muted text-xs mb-1">Duration (minutes)</label>
        <input
          type="number"
          min={15}
          step={15}
          value={form.duration_minutes}
          onChange={(e) => onChange("duration_minutes", parseInt(e.target.value) || 60)}
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      <div>
        <label className="block text-text-muted text-xs mb-1">Price ($)</label>
        <input
          type="number"
          min={0}
          step={0.01}
          defaultValue={centsToDisplay(form.price_cents)}
          onBlur={(e) => onChange("price_cents", displayToCents(e.target.value))}
          key={`price-${form.price_cents}`}
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      <div>
        <label className="block text-text-muted text-xs mb-1">Deposit ($)</label>
        <input
          type="number"
          min={0}
          step={0.01}
          defaultValue={centsToDisplay(form.deposit_cents)}
          onBlur={(e) => onChange("deposit_cents", displayToCents(e.target.value))}
          key={`deposit-${form.deposit_cents}`}
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-text-muted text-xs mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
          rows={3}
          placeholder="Describe the service…"
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold resize-none"
        />
      </div>
    </div>
  );
}

// ─── Gallery Uploader ─────────────────────────────────────────────────────────

function GalleryUploader({
  service,
  onUpdate,
}: {
  service: ServiceRow;
  onUpdate: (id: string, urls: string[], keys: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);

    const insforge = createBrowserClient();
    const { data, error } = await insforge.storage.from("services").uploadAuto(file);

    if (error || !data) {
      setUploadError("Upload failed. Try again.");
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const result = await addServiceImage(service.id, data.url, data.key);
    if (result.error) {
      setUploadError(result.error);
    } else {
      onUpdate(
        service.id,
        [...service.image_urls, data.url],
        [...service.image_keys, data.key]
      );
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleRemove(key: string, idx: number) {
    setRemoving(key);
    const result = await removeServiceImage(service.id, key);
    if (!result.error) {
      const newUrls = [...service.image_urls];
      const newKeys = [...service.image_keys];
      newUrls.splice(idx, 1);
      newKeys.splice(idx, 1);
      onUpdate(service.id, newUrls, newKeys);
    }
    setRemoving(null);
  }

  return (
    <div className="mt-4 pt-4 border-t border-border-light">
      <p className="text-text-muted text-xs uppercase tracking-widest mb-3">Gallery</p>

      <div className="flex flex-wrap gap-2 mb-3">
        {service.image_urls.map((url, i) => (
          <div key={service.image_keys[i] ?? url} className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className="w-20 h-20 object-cover rounded-lg border border-border-light"
            />
            <button
              onClick={() => handleRemove(service.image_keys[i], i)}
              disabled={removing === service.image_keys[i]}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              aria-label="Remove image"
            >
              ×
            </button>
          </div>
        ))}

        <label className="w-20 h-20 rounded-lg border border-dashed border-border-light flex items-center justify-center cursor-pointer hover:border-gold transition-colors">
          {uploading ? (
            <span className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          ) : (
            <span className="text-text-muted text-2xl leading-none">+</span>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {uploadError && <p className="text-error text-xs">{uploadError}</p>}
    </div>
  );
}

// ─── Main Manager ─────────────────────────────────────────────────────────────

export default function ServicesManager({
  initialServices,
}: {
  initialServices: ServiceRow[];
}) {
  const [services, setServices] = useState<ServiceRow[]>(initialServices);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<FormState>({ ...BLANK_FORM });
  const [addError, setAddError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>({ ...BLANK_FORM });
  const [editError, setEditError] = useState<string | null>(null);
  const [expandedGallery, setExpandedGallery] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<Record<string, string>>({});

  function patchAddForm(k: keyof FormState, v: string | number) {
    setAddForm((prev) => ({ ...prev, [k]: v }));
  }
  function patchEditForm(k: keyof FormState, v: string | number) {
    setEditForm((prev) => ({ ...prev, [k]: v }));
  }

  function handleGalleryUpdate(id: string, urls: string[], keys: string[]) {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, image_urls: urls, image_keys: keys } : s))
    );
  }

  function handleAdd() {
    setAddError(null);
    startTransition(async () => {
      const result = await createService(addForm);
      if (result.error) {
        setAddError(result.error);
        return;
      }
      // Optimistically append (page will revalidate for next hard load)
      setServices((prev) => [
        ...prev,
        {
          ...addForm,
          id: crypto.randomUUID(),
          image_urls: [],
          image_keys: [],
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ]);
      setAddForm({ ...BLANK_FORM });
      setShowAdd(false);
    });
  }

  function startEdit(svc: ServiceRow) {
    setEditingId(svc.id);
    setEditForm({
      name: svc.name,
      category: svc.category,
      description: svc.description ?? "",
      duration_minutes: svc.duration_minutes,
      price_cents: svc.price_cents,
      deposit_cents: svc.deposit_cents,
    });
    setEditError(null);
  }

  function handleEdit(id: string) {
    setEditError(null);
    startTransition(async () => {
      const result = await updateService(id, editForm);
      if (result.error) {
        setEditError(result.error);
        return;
      }
      setServices((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                ...editForm,
                description: editForm.description || null,
              }
            : s
        )
      );
      setEditingId(null);
    });
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleServiceActive(id, !current);
      if (result.error) {
        setActionError((prev) => ({ ...prev, [id]: result.error! }));
        return;
      }
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: !current } : s))
      );
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteService(id);
      if (result.error) {
        setActionError((prev) => ({ ...prev, [id]: result.error! }));
        return;
      }
      setServices((prev) => prev.filter((s) => s.id !== id));
    });
  }

  return (
    <div className="space-y-4">
      {/* Add service */}
      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="bg-accent text-accent-foreground rounded-full px-5 py-2.5 text-sm font-medium hover:bg-gold-light transition-colors"
        >
          + Add Service
        </button>
      ) : (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-text-primary font-medium mb-4">New Service</h2>
          <ServiceFormFields form={addForm} onChange={patchAddForm} />
          {addError && <p className="text-error text-xs mt-3">{addError}</p>}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleAdd}
              disabled={isPending}
              className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Create Service"}
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

      {/* Services list */}
      {services.length === 0 && (
        <p className="text-text-muted text-sm text-center py-12">No services yet. Add one above.</p>
      )}

      {services.map((svc) => (
        <div
          key={svc.id}
          className={`glass rounded-2xl p-6 ${!svc.is_active ? "opacity-60" : ""}`}
        >
          {editingId === svc.id ? (
            <>
              <ServiceFormFields form={editForm} onChange={patchEditForm} />
              {editError && <p className="text-error text-xs mt-3">{editError}</p>}
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => handleEdit(svc.id)}
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
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-display text-xl text-text-primary">{svc.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-text-muted">
                      {CATEGORY_LABELS[svc.category] ?? svc.category}
                    </span>
                    {!svc.is_active && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-error/15 text-error">
                        Inactive
                      </span>
                    )}
                  </div>
                  {svc.description && (
                    <p className="text-text-secondary text-sm mb-2 line-clamp-2">
                      {svc.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-text-muted">
                    <span>{svc.duration_minutes} min</span>
                    <span className="text-gold font-medium">{fmt(svc.price_cents)}</span>
                    {svc.deposit_cents > 0 && (
                      <span>{fmt(svc.deposit_cents)} deposit</span>
                    )}
                  </div>
                </div>

                {/* Primary image thumbnail */}
                {svc.image_urls[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={svc.image_urls[0]}
                    alt=""
                    className="w-16 h-16 object-cover rounded-lg border border-border-light shrink-0"
                  />
                )}
              </div>

              {/* Action row */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border-light flex-wrap">
                <button
                  onClick={() => startEdit(svc)}
                  className="text-text-secondary text-xs hover:text-text-primary transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() =>
                    setExpandedGallery(expandedGallery === svc.id ? null : svc.id)
                  }
                  className="text-text-secondary text-xs hover:text-text-primary transition-colors"
                >
                  Gallery ({svc.image_urls.length})
                </button>
                <button
                  onClick={() => handleToggle(svc.id, svc.is_active)}
                  disabled={isPending}
                  className="text-text-secondary text-xs hover:text-text-primary transition-colors disabled:opacity-50"
                >
                  {svc.is_active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${svc.name}"? This cannot be undone.`)) {
                      handleDelete(svc.id);
                    }
                  }}
                  disabled={isPending}
                  className="text-error text-xs hover:opacity-80 transition-opacity disabled:opacity-50 ml-auto"
                >
                  Delete
                </button>
              </div>

              {actionError[svc.id] && (
                <p className="text-error text-xs mt-2">{actionError[svc.id]}</p>
              )}

              {/* Gallery (expanded) */}
              {expandedGallery === svc.id && (
                <GalleryUploader
                  service={svc}
                  onUpdate={handleGalleryUpdate}
                />
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
