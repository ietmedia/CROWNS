import { getAllGiftCards } from "@/actions/gift-cards";
import GiftCardsAdmin from "@/components/admin/GiftCardsAdmin";

export default async function AdminGiftCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const { data: cards } = await getAllGiftCards({ search: params.search });

  const totalIssued = cards.reduce((s, c) => s + c.amount_cents, 0);
  const totalBalance = cards.reduce((s, c) => s + c.balance_cents, 0);

  function fmt(cents: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-text-primary mb-1">Gift Cards</h1>
        <p className="text-text-muted text-sm">
          {cards.length} cards · {fmt(totalIssued)} issued · {fmt(totalBalance)} outstanding
        </p>
      </div>

      <GiftCardsAdmin initialCards={cards} />
    </div>
  );
}
