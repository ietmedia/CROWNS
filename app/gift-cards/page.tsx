export const dynamic = "force-dynamic";

import Link from "next/link";
import { getMyGiftCards } from "@/actions/gift-cards";
import GiftCardPurchase from "@/components/client/GiftCardPurchase";

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function GiftCardsPage() {
  const { data: cards } = await getMyGiftCards();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-text-muted text-sm hover:text-text-secondary transition-colors">
          ← Home
        </Link>
        <span className="font-display text-lg text-gradient-gold">Crowns Enchanted</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="font-display text-4xl text-text-primary mb-2">Gift Cards</h1>
          <p className="text-text-muted">Give the gift of a luxury hair experience</p>
        </div>

        {/* Purchase */}
        <GiftCardPurchase />

        {/* My cards */}
        {cards.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-2xl text-text-primary mb-4">My Gift Cards</h2>
            <div className="space-y-3">
              {cards.map((card) => (
                <div key={card.id} className="glass rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-text-muted text-xs uppercase tracking-widest mb-1">Code</p>
                      <p className="font-mono text-gold text-lg tracking-widest">{card.code}</p>
                      {card.recipient_email && (
                        <p className="text-text-muted text-xs mt-1">Sent to {card.recipient_email}</p>
                      )}
                      {card.message && (
                        <p className="text-text-secondary text-sm mt-1 italic">&ldquo;{card.message}&rdquo;</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-gold text-xl font-display">{fmt(card.balance_cents)}</p>
                      <p className="text-text-muted text-xs">of {fmt(card.amount_cents)}</p>
                      {card.expires_at && (
                        <p className="text-text-muted text-xs mt-1">
                          Expires {new Date(card.expires_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
