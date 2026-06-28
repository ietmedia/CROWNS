export const dynamic = "force-dynamic";

import Link from "next/link";
import { getShopProducts } from "@/actions/shop";

const CATEGORY_LABELS: Record<string, string> = {
  kit: "Kits",
  ebook: "eBooks",
  digital: "Digital",
  retail: "Retail",
};

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const { data: allProducts } = await getShopProducts(false);

  const activeCategory = params.category ?? "all";
  const products =
    activeCategory === "all"
      ? allProducts
      : allProducts.filter((p) => p.category === activeCategory);

  const categories = [...new Set(allProducts.map((p) => p.category))];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-text-muted text-sm hover:text-text-secondary transition-colors">
          ← Home
        </Link>
        <span className="font-display text-lg text-gradient-gold">Crowns Enchanted</span>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="font-display text-5xl text-text-primary mb-3">Shop</h1>
          <p className="text-text-muted">Curated products, kits & digital downloads for your crown</p>
        </div>

        {/* Category filters */}
        {categories.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap mb-8">
            <a
              href="/shop"
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                activeCategory === "all"
                  ? "bg-accent text-accent-foreground border-accent"
                  : "border-border-light text-text-muted hover:border-gold hover:text-text-primary"
              }`}
            >
              All
            </a>
            {categories.map((cat) => (
              <a
                key={cat}
                href={`/shop?category=${cat}`}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  activeCategory === cat
                    ? "bg-accent text-accent-foreground border-accent"
                    : "border-border-light text-text-muted hover:border-gold hover:text-text-primary"
                }`}
              >
                {CATEGORY_LABELS[cat] ?? cat}
              </a>
            ))}
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-text-muted text-lg mb-2">Coming soon</p>
            <p className="text-text-muted text-sm">Our shop is being stocked. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="glass rounded-2xl overflow-hidden flex flex-col">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-surface-elevated flex items-center justify-center">
                    <span className="text-text-muted text-4xl">✦</span>
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-xs text-text-muted capitalize">
                        {CATEGORY_LABELS[product.category] ?? product.category}
                      </span>
                      <h3 className="font-display text-lg text-text-primary">{product.name}</h3>
                    </div>
                    <p className="text-gold font-medium shrink-0">{fmt(product.price_cents)}</p>
                  </div>
                  {product.description && (
                    <p className="text-text-secondary text-sm mb-4 flex-1 line-clamp-3">
                      {product.description}
                    </p>
                  )}
                  {product.inventory === 0 ? (
                    <p className="text-text-muted text-sm text-center">Out of stock</p>
                  ) : product.stripe_price_id ? (
                    <button
                      className="mt-auto bg-accent text-accent-foreground rounded-full py-2.5 text-sm font-medium hover:bg-gold-light transition-colors"
                    >
                      Buy Now
                    </button>
                  ) : (
                    <button
                      className="mt-auto border border-gold text-gold rounded-full py-2.5 text-sm font-medium hover:bg-gold/10 transition-colors"
                    >
                      Contact to Purchase
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
