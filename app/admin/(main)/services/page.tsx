import { getServices } from "@/actions/services";
import ServicesManager from "@/components/admin/ServicesManager";

export default async function ServicesPage() {
  const { data: services } = await getServices();

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl text-text-primary mb-1">Services</h1>
          <p className="text-text-muted text-sm">{services.length} services total</p>
        </div>
      </div>

      <ServicesManager initialServices={services} />
    </div>
  );
}
