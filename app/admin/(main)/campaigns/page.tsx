export const dynamic = "force-dynamic";

import { getCampaigns } from "@/actions/campaigns";
import CampaignsAdmin from "@/components/admin/CampaignsAdmin";

export default async function AdminCampaignsPage() {
  const { data: campaigns } = await getCampaigns();

  const total = campaigns.length;
  const sent = campaigns.filter((c) => c.status === "sent").length;
  const totalReached = campaigns.reduce((s, c) => s + c.sent_count, 0);

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-text-primary mb-1">Campaigns</h1>
        <p className="text-text-muted text-sm">
          {total} campaign{total !== 1 ? "s" : ""} · {sent} sent · {totalReached} total clients reached
        </p>
      </div>

      <CampaignsAdmin initialCampaigns={campaigns} />
    </div>
  );
}
