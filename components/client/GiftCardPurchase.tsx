"use client";

import { useState, useTransition } from "react";
import { purchaseGiftCard } from "@/actions/gift-cards";

const AMOUNTS = [2500, 5000, 10000, 25000];

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

export default function GiftCardPurchase() {
  const [amount, setAmount] = useState(5000);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCents = useCustom
    ? Math.round(parseFloat(customAmount || "0") * 100)
    : amount;

  function handlePurchase() {
    setError(null);
    startTransition(async () => {
      const result = await purchaseGiftCard({
        amount_cents: selectedCents,
        recipient_email: recipient,
        message,
      });
      if (result.error) {
        setError(result.error);
      } else if (result.code) {
        setCode(result.code);
      }
    });
  }

  if (code) {
    return (
      <div className="glass-gold rounded-2xl p-8 text-center">
        <p className="text-text-muted text-xs uppercase tracking-widest mb-2">Gift Card Created!</p>
        <p className="font-mono text-gold text-3xl tracking-[0.2em] mb-4">{code}</p>
        <p className="text-text-secondary text-sm mb-6">
          Save this code and share it with your recipient.
          {recipient && ` We'll also send a note to ${recipient}.`}
        </p>
        <button
          onClick={() => {
            setCode(null);
            setRecipient("");
            setMessage("");
            setCustomAmount("");
            setUseCustom(false);
          }}
          className="bg-accent text-accent-foreground rounded-full px-6 py-2.5 text-sm font-medium hover:bg-gold-light transition-colors"
        >
          Purchase Another
        </button>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 space-y-6">
      <div>
        <p className="text-text-muted text-xs uppercase tracking-widest mb-3">Amount</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => { setAmount(a); setUseCustom(false); }}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                !useCustom && amount === a
                  ? "bg-accent text-accent-foreground border-accent"
                  : "border-border-light text-text-muted hover:border-gold hover:text-text-primary"
              }`}
            >
              {fmt(a)}
            </button>
          ))}
          <button
            onClick={() => setUseCustom(true)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              useCustom
                ? "bg-accent text-accent-foreground border-accent"
                : "border-border-light text-text-muted hover:border-gold hover:text-text-primary"
            }`}
          >
            Custom
          </button>
        </div>
        {useCustom && (
          <div className="flex items-center gap-2">
            <span className="text-text-muted">$</span>
            <input
              type="number"
              min={10}
              step={5}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-32 bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-text-muted text-xs mb-1">Recipient Email (optional)</label>
        <input
          type="email"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="recipient@example.com"
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      <div>
        <label className="block text-text-muted text-xs mb-1">Message (optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          placeholder="Add a personal message…"
          className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold resize-none"
        />
      </div>

      {error && <p className="text-error text-sm">{error}</p>}

      <button
        onClick={handlePurchase}
        disabled={isPending || selectedCents < 1000}
        className="w-full bg-accent text-accent-foreground rounded-full py-3 text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
      >
        {isPending ? "Processing…" : `Purchase ${fmt(selectedCents)} Gift Card`}
      </button>
    </div>
  );
}
