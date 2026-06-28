import { getShopProducts } from "@/actions/shop";
import ShopAdmin from "@/components/admin/ShopAdmin";

export default async function AdminShopPage() {
  const { data: products } = await getShopProducts(true);

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-text-primary mb-1">Shop</h1>
        <p className="text-text-muted text-sm">{products.length} products</p>
      </div>

      <ShopAdmin initialProducts={products} />
    </div>
  );
}
