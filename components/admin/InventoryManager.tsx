"use client";

import { useState, useTransition } from "react";
import {
  type ProductRow,
  createProduct,
  updateProduct,
  adjustStock,
  toggleProductActive,
} from "@/actions/inventory";

const CATEGORIES = ["retail", "supply", "equipment"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  retail: "Retail",
  supply: "Supply",
  equipment: "Equipment",
};

const BLANK: ProductForm = {
  name: "",
  category: "retail",
  sku: "",
  description: "",
  quantity_on_hand: 0,
  reorder_level: 5,
  cost_cents: 0,
  price_cents: 0,
  supplier_name: "",
  supplier_contact: "",
};

type ProductForm = {
  name: string;
  category: string;
  sku: string;
  description: string;
  quantity_on_hand: number;
  reorder_level: number;
  cost_cents: number;
  price_cents: number;
  supplier_name: string;
  supplier_contact: string;
};

function centsToDisplay(c: number) {
  return (c / 100).toFixed(2);
}
function displayToCents(s: string) {
  return Math.round(parseFloat(s || "0") * 100);
}
function fmt(c: number) {
  return `$${(c / 100).toFixed(0)}`;
}

function ProductFormFields({
  form,
  onChange,
}: {
  form: ProductForm;
  onChange: (k: keyof ProductForm, v: string | number) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="block text-text-muted text-xs mb-1">Product Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="e.g. Shea Moisture Shampoo"
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
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-text-muted text-xs mb-1">SKU</label>
        <input
          type="text"
          value={form.sku}
          onChange={(e) => onChange("sku", e.target.value)}
          placeholder="Optional"
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      <div>
        <label className="block text-text-muted text-xs mb-1">Qty on Hand</label>
        <input
          type="number"
          min={0}
          value={form.quantity_on_hand}
          onChange={(e) => onChange("quantity_on_hand", parseInt(e.target.value) || 0)}
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      <div>
        <label className="block text-text-muted text-xs mb-1">Reorder Level</label>
        <input
          type="number"
          min={0}
          value={form.reorder_level}
          onChange={(e) => onChange("reorder_level", parseInt(e.target.value) || 0)}
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      <div>
        <label className="block text-text-muted text-xs mb-1">Cost ($)</label>
        <input
          type="number"
          min={0}
          step={0.01}
          defaultValue={centsToDisplay(form.cost_cents)}
          onBlur={(e) => onChange("cost_cents", displayToCents(e.target.value))}
          key={`cost-${form.cost_cents}`}
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      <div>
        <label className="block text-text-muted text-xs mb-1">Retail Price ($)</label>
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
        <label className="block text-text-muted text-xs mb-1">Supplier</label>
        <input
          type="text"
          value={form.supplier_name}
          onChange={(e) => onChange("supplier_name", e.target.value)}
          placeholder="Supplier name"
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      <div>
        <label className="block text-text-muted text-xs mb-1">Supplier Contact</label>
        <input
          type="text"
          value={form.supplier_contact}
          onChange={(e) => onChange("supplier_contact", e.target.value)}
          placeholder="Email or phone"
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-text-muted text-xs mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
          rows={2}
          placeholder="Optional notes…"
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold resize-none"
        />
      </div>
    </div>
  );
}

export default function InventoryManager({
  initialProducts,
}: {
  initialProducts: ProductRow[];
}) {
  const [products, setProducts] = useState<ProductRow[]>(initialProducts);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<ProductForm>({ ...BLANK });
  const [addError, setAddError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProductForm>({ ...BLANK });
  const [editError, setEditError] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(0);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function patchAdd(k: keyof ProductForm, v: string | number) {
    setAddForm((p) => ({ ...p, [k]: v }));
  }
  function patchEdit(k: keyof ProductForm, v: string | number) {
    setEditForm((p) => ({ ...p, [k]: v }));
  }

  function handleAdd() {
    setAddError(null);
    startTransition(async () => {
      const result = await createProduct(addForm);
      if (result.error) { setAddError(result.error); return; }
      setProducts((prev) => [
        ...prev,
        {
          ...addForm,
          id: crypto.randomUUID(),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sku: addForm.sku || null,
          description: addForm.description || null,
          supplier_name: addForm.supplier_name || null,
          supplier_contact: addForm.supplier_contact || null,
        },
      ]);
      setAddForm({ ...BLANK });
      setShowAdd(false);
    });
  }

  function startEdit(p: ProductRow) {
    setEditingId(p.id);
    setEditForm({
      name: p.name,
      category: p.category,
      sku: p.sku ?? "",
      description: p.description ?? "",
      quantity_on_hand: p.quantity_on_hand,
      reorder_level: p.reorder_level,
      cost_cents: p.cost_cents,
      price_cents: p.price_cents,
      supplier_name: p.supplier_name ?? "",
      supplier_contact: p.supplier_contact ?? "",
    });
    setEditError(null);
  }

  function handleEdit(id: string) {
    setEditError(null);
    startTransition(async () => {
      const result = await updateProduct(id, editForm);
      if (result.error) { setEditError(result.error); return; }
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                ...editForm,
                sku: editForm.sku || null,
                description: editForm.description || null,
                supplier_name: editForm.supplier_name || null,
                supplier_contact: editForm.supplier_contact || null,
                updated_at: new Date().toISOString(),
              }
            : p
        )
      );
      setEditingId(null);
    });
  }

  function handleAdjust(id: string, delta: number) {
    startTransition(async () => {
      const result = await adjustStock(id, delta);
      if (result.error) {
        setErrors((prev) => ({ ...prev, [id]: result.error! }));
        return;
      }
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, quantity_on_hand: result.quantity ?? p.quantity_on_hand + delta }
            : p
        )
      );
      setAdjusting(null);
      setAdjustDelta(0);
    });
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleProductActive(id, !current);
      if (result.error) {
        setErrors((prev) => ({ ...prev, [id]: result.error! }));
        return;
      }
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: !current } : p))
      );
    });
  }

  const isLow = (p: ProductRow) => p.quantity_on_hand <= p.reorder_level && p.is_active;

  return (
    <div className="space-y-4">
      {/* Add */}
      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="bg-accent text-accent-foreground rounded-full px-5 py-2.5 text-sm font-medium hover:bg-gold-light transition-colors"
        >
          + Add Product
        </button>
      ) : (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-text-primary font-medium mb-4">New Product</h2>
          <ProductFormFields form={addForm} onChange={patchAdd} />
          {addError && <p className="text-error text-xs mt-3">{addError}</p>}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAdd}
              disabled={isPending}
              className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Add Product"}
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

      {products.length === 0 && (
        <p className="text-text-muted text-sm text-center py-12">No products match the current filter.</p>
      )}

      {/* Table */}
      {products.length > 0 && editingId === null && (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Product", "Category", "Stock", "Cost", "Price", ""].map((h) => (
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
              {products.map((p) => (
                <tr
                  key={p.id}
                  className={`hover:bg-surface-elevated transition-colors ${!p.is_active ? "opacity-50" : ""}`}
                >
                  <td className="px-4 py-3">
                    <p className="text-text-primary font-medium">{p.name}</p>
                    {p.sku && <p className="text-text-muted text-xs">{p.sku}</p>}
                  </td>
                  <td className="px-4 py-3 text-text-secondary capitalize">
                    {CATEGORY_LABELS[p.category] ?? p.category}
                  </td>
                  <td className="px-4 py-3">
                    {adjusting === p.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setAdjustDelta((d) => d - 1)}
                          className="w-6 h-6 rounded bg-surface-elevated text-text-primary text-sm hover:bg-border-light transition-colors"
                        >
                          −
                        </button>
                        <span className={`min-w-[2rem] text-center font-medium ${isLow(p) ? "text-error" : "text-text-primary"}`}>
                          {p.quantity_on_hand + adjustDelta}
                        </span>
                        <button
                          onClick={() => setAdjustDelta((d) => d + 1)}
                          className="w-6 h-6 rounded bg-surface-elevated text-text-primary text-sm hover:bg-border-light transition-colors"
                        >
                          +
                        </button>
                        <button
                          onClick={() => handleAdjust(p.id, adjustDelta)}
                          disabled={isPending || adjustDelta === 0}
                          className="ml-1 text-xs text-gold hover:opacity-80 disabled:opacity-40"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setAdjusting(null); setAdjustDelta(0); }}
                          className="text-xs text-text-muted hover:text-text-secondary"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAdjusting(p.id); setAdjustDelta(0); }}
                        className={`flex items-center gap-1 hover:opacity-80 transition-opacity ${isLow(p) ? "text-error" : "text-text-secondary"}`}
                      >
                        <span className={isLow(p) ? "font-semibold" : ""}>{p.quantity_on_hand}</span>
                        {isLow(p) && <span className="text-xs">⚠</span>}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{fmt(p.cost_cents)}</td>
                  <td className="px-4 py-3 text-gold font-medium">{fmt(p.price_cents)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 justify-end">
                      <button
                        onClick={() => startEdit(p)}
                        className="text-text-muted text-xs hover:text-text-primary transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggle(p.id, p.is_active)}
                        disabled={isPending}
                        className="text-text-muted text-xs hover:text-text-primary transition-colors disabled:opacity-40"
                      >
                        {p.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                    {errors[p.id] && (
                      <p className="text-error text-xs mt-1 text-right">{errors[p.id]}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit form */}
      {editingId && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-text-primary font-medium mb-4">Edit Product</h2>
          <ProductFormFields form={editForm} onChange={patchEdit} />
          {editError && <p className="text-error text-xs mt-3">{editError}</p>}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => handleEdit(editingId)}
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
        </div>
      )}
    </div>
  );
}
