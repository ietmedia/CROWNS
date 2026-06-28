export const dynamic = "force-dynamic";

import Link from "next/link";
import { getMemberships, getMyMembership, cancelMyMembership, subscribeMembership } from "@/actions/memberships";
import MembershipPortal from "@/components/client/MembershipPortal";

export default async function MyMembershipPage() {
  const [{ data: current }, { data: tiers }] = await Promise.all([
    getMyMembership(),
    getMemberships(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      {/* Simple nav */}
      <header className="border-b border-border px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-text-muted text-sm hover:text-text-secondary transition-colors">
          ← Home
        </Link>
        <span className="font-display text-lg text-gradient-gold">Crowns Enchanted</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="font-display text-4xl text-text-primary mb-2">My Membership</h1>
          <p className="text-text-muted">Manage your Crown Enchanted membership tier</p>
        </div>

        <MembershipPortal
          currentMembership={current}
          tiers={tiers}
          subscribeFn={subscribeMembership}
          cancelFn={cancelMyMembership}
        />
      </main>
    </div>
  );
}
