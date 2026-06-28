import { getProducts } from "@/actions/inventory";
import InventoryManager from "@/components/admin/InventoryManager";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; low_stock?: string }>;
}) {
  const params = await searchParams;
  const category = params.category ?? "all";
  const lowStock = params.low_stock === "1";

  const { data: products } = await getProducts({ category, low_stock: lowStock });
  const lowStockCount = products.filter((p) => p.quantity_on_hand <= p.reorder_level && p.is_active).length;

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl text-text-primary mb-1">Inventory</h1>
          <p className="text-text-muted text-sm">
            {products.length} items
            {lowStockCount > 0 && (
              <span className="ml-2 text-error">· {lowStockCount} low stock</span>
            )}
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: "All", value: "all" },
            { label: "Retail", value: "retail" },
            { label: "Supply", value: "supply" },
            { label: "Equipment", value: "equipment" },
          ].map((f) => (
            <a
              key={f.value}
              href={`?category=${f.value}${lowStock ? "&low_stock=1" : ""}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                category === f.value
                  ? "bg-accent text-accent-foreground"
                  : "text-text-muted border border-border-light hover:text-text-primary"
              }`}
            >
              {f.label}
            </a>
          ))}
          <a
            href={`?category=${category}${lowStock ? "" : "&low_stock=1"}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              lowStock
                ? "bg-error/20 text-error border border-error/30"
                : "text-text-muted border border-border-light hover:text-error"
            }`}
          >
            Low Stock
          </a>
        </div>
      </div>

      <InventoryManager initialProducts={products} />
    </div>
  );
}
