export const dynamic = "force-dynamic";

import Link from "next/link";
import CrownConcierge from "@/components/client/CrownConcierge";

export default function ConciergePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center gap-4 shrink-0">
        <Link href="/" className="text-text-muted text-sm hover:text-text-secondary transition-colors">
          ← Home
        </Link>
        <span className="font-display text-lg text-gradient-gold">Crowns Enchanted</span>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col">
        <div className="mb-6 text-center">
          <h1 className="font-display text-4xl text-text-primary mb-2">Crown Concierge</h1>
          <p className="text-text-muted text-sm">
            Your personal luxury hair care advisor — ask anything about services, hair health, or booking.
          </p>
        </div>

        <CrownConcierge />
      </div>
    </div>
  );
}
