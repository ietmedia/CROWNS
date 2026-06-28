"use client";

import { useState, useTransition } from "react";
import { type GiftCard, adminCreateGiftCard, adjustGiftCardBalance } from "@/actions/gift-cards";

type AdminCard = GiftCard & { clients: { id: string; full_name: string } | null };

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function GiftCardsAdmin({
  initialCards,
}: {
  initialCards: AdminCard[];
}) {
  const [cards, setCards] = useState<AdminCard[]>(initialCards);
  const [showCreate, setShowCreate] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newRecipient, setNewRecipient] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustValue, setAdjustValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleCreate() {
    setCreateError(null);
    startTransition(async () => {
      const result = await adminCreateGiftCard({
        amount_cents: Math.round(parseFloat(newAmount || "0") * 100),
        recipient_email: newRecipient,
        message: newMessage,
      });
      if (result.error) { setCreateError(result.error); return; }
      setCreatedCode(result.code ?? null);
      setNewAmount("");
      setNewRecipient("");
      setNewMessage("");
    });
  }

  function handleAdjust(id: string) {
    startTransition(async () => {
      const result = await adjustGiftCardBalance(
        id,
        Math.round(parseFloat(adjustValue || "0") * 100)
      );
      if (result.error) {
        setErrors((p) => ({ ...p, [id]: result.error! }));
      } else {
        setCards((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, balance_cents: Math.round(parseFloat(adjustValue || "0") * 100) }
              : c
          )
        );
        setAdjustingId(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Create */}
      {!showCreate ? (
        <button
          onClick={() => setShowCreate(true)}
          className="bg-accent text-accent-foreground rounded-full px-5 py-2.5 text-sm font-medium hover:bg-gold-light transition-colors"
        >
          + Issue Gift Card
        </button>
      ) : (
        <div className="glass rounded-2xl p-6 space-y-4">
          <h2 className="text-text-primary font-medium">Issue Gift Card</h2>
          {createdCode ? (
            <div className="text-center py-4">
              <p className="text-text-muted text-xs uppercase tracking-widest mb-2">Created!</p>
              <p className="font-mono text-gold text-2xl tracking-[0.15em]">{createdCode}</p>
              <button
                onClick={() => { setCreatedCode(null); setShowCreate(false); }}
                className="mt-4 text-text-muted text-sm hover:text-text-secondary transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-muted text-xs mb-1">Amount ($) *</label>
                  <input type="number" min={1} step={5} value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold" />
                </div>
                <div>
                  <label className="block text-text-muted text-xs mb-1">Recipient Email</label>
                  <input type="email" value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-text-muted text-xs mb-1">Message</label>
                  <input type="text" value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Optional personal note"
                    className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold" />
                </div>
              </div>
              {createError && <p className="text-error text-xs">{createError}</p>}
              <div className="flex gap-3">
                <button onClick={handleCreate} disabled={isPending}
                  className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50">
                  {isPending ? "Creating…" : "Create"}
                </button>
                <button onClick={() => { setShowCreate(false); setCreateError(null); }}
                  className="text-text-muted text-sm hover:text-text-secondary transition-colors">
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Table */}
      {cards.length > 0 && (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Code", "Purchaser", "Amount", "Balance", "Issued", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-text-muted text-xs uppercase tracking-widest font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cards.map((card) => (
                <tr key={card.id} className="hover:bg-surface-elevated transition-colors">
                  <td className="px-4 py-3 font-mono text-gold text-xs">{card.code}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {card.clients?.full_name ?? card.recipient_email ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{fmt(card.amount_cents)}</td>
                  <td className="px-4 py-3">
                    {adjustingId === card.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-text-muted text-xs">$</span>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={adjustValue}
                          onChange={(e) => setAdjustValue(e.target.value)}
                          className="w-20 bg-surface border border-border-light rounded px-2 py-1 text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-gold"
                        />
                        <button
                          onClick={() => handleAdjust(card.id)}
                          disabled={isPending}
                          className="text-xs text-gold hover:opacity-80 disabled:opacity-40"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setAdjustingId(null)}
                          className="text-xs text-text-muted hover:text-text-secondary"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <span className={card.balance_cents === 0 ? "text-text-muted" : "text-text-primary"}>
                        {fmt(card.balance_cents)}
                      </span>
                    )}
                    {errors[card.id] && (
                      <p className="text-error text-xs mt-1">{errors[card.id]}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">{fmtDate(card.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setAdjustingId(card.id);
                        setAdjustValue((card.balance_cents / 100).toFixed(2));
                      }}
                      className="text-text-muted text-xs hover:text-text-primary transition-colors"
                    >
                      Adjust
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
