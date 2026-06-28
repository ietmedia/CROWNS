"use client";

import { useState, useTransition } from "react";
import {
  type ShopProduct,
  createShopProduct,
  updateShopProduct,
  toggleShopProductActive,
} from "@/actions/shop";

const CATEGORY_LABELS: Record<string, string> = {
  kit: "Kit", ebook: "eBook", digital: "Digital", retail: "Retail",
};

type ProductForm = {
  name: string;
  description: string;
  price: string;
  category: string;
  stripe_price_id: string;
  inventory: number;
};

const BLANK: ProductForm = {
  name: "", description: "", price: "0.00", category: "retail",
  stripe_price_id: "", inventory: -1,
};

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function Fields({ form, onChange }: {
  form: ProductForm;
  onChange: (k: keyof ProductForm, v: string | number) => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="block text-text-muted text-xs mb-1">Name *</label>
        <input type="text" value={form.name} onChange={(e) => onChange("name", e.target.value)}
          placeholder="e.g. Curl Revival Kit"
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold" />
      </div>
      <div>
        <label className="block text-text-muted text-xs mb-1">Category</label>
        <select value={form.category} onChange={(e) => onChange("category", e.target.value)}
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold">
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-text-muted text-xs mb-1">Price ($)</label>
        <input type="number" min={0} step={0.01} value={form.price}
          onChange={(e) => onChange("price", e.target.value)}
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold" />
      </div>
      <div>
        <label className="block text-text-muted text-xs mb-1">Stripe Price ID</label>
        <input type="text" value={form.stripe_price_id}
          onChange={(e) => onChange("stripe_price_id", e.target.value)}
          placeholder="price_…"
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold" />
      </div>
      <div>
        <label className="block text-text-muted text-xs mb-1">Inventory (-1 = unlimited)</label>
        <input type="number" min={-1} value={form.inventory}
          onChange={(e) => onChange("inventory", parseInt(e.target.value) || -1)}
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold" />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-text-muted text-xs mb-1">Description</label>
        <textarea value={form.description} onChange={(e) => onChange("description", e.target.value)}
          rows={3} placeholder="Describe the product…"
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold resize-none" />
      </div>
    </div>
  );
}

export default function ShopAdmin({ initialProducts }: { initialProducts: ShopProduct[] }) {
  const [products, setProducts] = useState<ShopProduct[]>(initialProducts);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<ProductForm>({ ...BLANK });
  const [addError, setAddError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProductForm>({ ...BLANK });
  const [editError, setEditError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});

  function pa(k: keyof ProductForm, v: string | number) { setAddForm((p) => ({ ...p, [k]: v })); }
  function pe(k: keyof ProductForm, v: string | number) { setEditForm((p) => ({ ...p, [k]: v })); }

  function handleAdd() {
    setAddError(null);
    startTransition(async () => {
      const result = await createShopProduct({
        name: addForm.name, description: addForm.description,
        price_cents: Math.round(parseFloat(addForm.price || "0") * 100),
        category: addForm.category, stripe_price_id: addForm.stripe_price_id,
        inventory: addForm.inventory,
      });
      if (result.error) { setAddError(result.error); return; }
      setProducts((prev) => [...prev, {
        id: crypto.randomUUID(), name: addForm.name,
        description: addForm.description || null,
        price_cents: Math.round(parseFloat(addForm.price || "0") * 100),
        category: addForm.category,
        stripe_price_id: addForm.stripe_price_id || null,
        inventory: addForm.inventory, image_url: null,
        is_active: true, created_at: new Date().toISOString(),
      }]);
      setAddForm({ ...BLANK });
      setShowAdd(false);
    });
  }

  function handleEdit(id: string) {
    setEditError(null);
    startTransition(async () => {
      const result = await updateShopProduct(id, {
        name: editForm.name, description: editForm.description,
        price_cents: Math.round(parseFloat(editForm.price || "0") * 100),
        category: editForm.category, stripe_price_id: editForm.stripe_price_id,
        inventory: editForm.inventory,
      });
      if (result.error) { setEditError(result.error); return; }
      setProducts((prev) => prev.map((p) => p.id === id ? {
        ...p, name: editForm.name, description: editForm.description || null,
        price_cents: Math.round(parseFloat(editForm.price || "0") * 100),
        category: editForm.category,
        stripe_price_id: editForm.stripe_price_id || null,
        inventory: editForm.inventory,
      } : p));
      setEditingId(null);
    });
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleShopProductActive(id, !current);
      if (result.error) { setActionErrors((p) => ({ ...p, [id]: result.error! })); return; }
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, is_active: !current } : p));
    });
  }

  return (
    <div className="space-y-4">
      {!showAdd ? (
        <button onClick={() => setShowAdd(true)}
          className="bg-accent text-accent-foreground rounded-full px-5 py-2.5 text-sm font-medium hover:bg-gold-light transition-colors">
          + Add Product
        </button>
      ) : (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-text-primary font-medium mb-4">New Product</h2>
          <Fields form={addForm} onChange={pa} />
          {addError && <p className="text-error text-xs mt-3">{addError}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={handleAdd} disabled={isPending}
              className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50">
              {isPending ? "Saving…" : "Add Product"}
            </button>
            <button onClick={() => { setShowAdd(false); setAddError(null); }}
              className="text-text-muted text-sm hover:text-text-secondary transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="glass rounded-xl overflow-hidden">
        {products.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-10">No products yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Product", "Category", "Price", "Stock", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-text-muted text-xs uppercase tracking-widest font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) =>
                editingId === p.id ? (
                  <tr key={p.id}>
                    <td colSpan={5} className="px-4 py-4">
                      <Fields form={editForm} onChange={pe} />
                      {editError && <p className="text-error text-xs mt-3">{editError}</p>}
                      <div className="flex gap-3 mt-3">
                        <button onClick={() => handleEdit(p.id)} disabled={isPending}
                          className="bg-accent text-accent-foreground rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-gold-light transition-colors disabled:opacity-50">
                          {isPending ? "Saving…" : "Save"}
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="text-text-muted text-xs hover:text-text-secondary transition-colors">
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={p.id} className={`hover:bg-surface-elevated transition-colors ${!p.is_active ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="text-text-primary">{p.name}</p>
                      {p.description && <p className="text-text-muted text-xs line-clamp-1">{p.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{CATEGORY_LABELS[p.category] ?? p.category}</td>
                    <td className="px-4 py-3 text-gold font-medium">{fmt(p.price_cents)}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {p.inventory === -1 ? "Unlimited" : p.inventory === 0 ? <span className="text-error">Out</span> : p.inventory}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 justify-end">
                        <button onClick={() => {
                          setEditingId(p.id);
                          setEditForm({
                            name: p.name, description: p.description ?? "",
                            price: (p.price_cents / 100).toFixed(2),
                            category: p.category,
                            stripe_price_id: p.stripe_price_id ?? "",
                            inventory: p.inventory,
                          });
                          setEditError(null);
                        }} className="text-text-muted text-xs hover:text-text-primary transition-colors">Edit</button>
                        <button onClick={() => handleToggle(p.id, p.is_active)} disabled={isPending}
                          className="text-text-muted text-xs hover:text-text-primary transition-colors disabled:opacity-40">
                          {p.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                      {actionErrors[p.id] && <p className="text-error text-xs text-right mt-1">{actionErrors[p.id]}</p>}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
