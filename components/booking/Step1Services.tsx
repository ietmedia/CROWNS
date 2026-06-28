"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { insforge } from "@/lib/insforge-client";
import { formatCents } from "@/lib/utils";
import type { Service, ServiceCategory } from "@/types";

const CATEGORY_LABELS: Record<ServiceCategory | "all", string> = {
  all: "All Services",
  hair: "Natural Hair",
  color: "Color",
  nails: "Nails",
  skin: "Skin & Scalp",
  other: "Wellness",
};

interface Props {
  onSelect: (service: Service) => void;
}

export default function Step1Services({ onSelect }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [filter, setFilter] = useState<ServiceCategory | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    insforge.database
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        setServices((data as Service[]) ?? []);
        setLoading(false);
      });
  }, []);

  const categories = [
    "all" as const,
    ...Array.from(new Set(services.map((s) => s.category))),
  ];

  const visible =
    filter === "all" ? services : services.filter((s) => s.category === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="font-display text-4xl text-text-primary mb-3">
          Choose Your Service
        </h2>
        <p className="text-text-secondary text-sm max-w-md mx-auto">
          Every treatment is crafted to honor your crown and restore your spirit.
        </p>
      </div>

      {/* Category filters */}
      {categories.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                filter === cat
                  ? "bg-accent text-accent-foreground"
                  : "border border-border-light text-text-secondary hover:border-border-gold hover:text-gold"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      )}

      {/* Service grid */}
      {visible.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          No services available in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((service, i) => (
            <ServiceCard
              key={service.id}
              service={service}
              index={i}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceCard({
  service,
  index,
  onSelect,
}: {
  service: Service;
  index: number;
  onSelect: (s: Service) => void;
}) {
  const heroImage = service.image_urls?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="glass rounded-2xl overflow-hidden group flex flex-col"
    >
      {/* Image */}
      <div className="relative h-40 bg-surface-elevated overflow-hidden">
        {heroImage ? (
          <img
            src={heroImage}
            alt={service.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CrownIcon />
          </div>
        )}
        {service.deposit_cents > 0 && (
          <span className="absolute top-3 right-3 bg-gold/20 text-gold border border-gold/30 text-xs font-medium px-2.5 py-1 rounded-full">
            Deposit req.
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display text-xl text-text-primary mb-1">
          {service.name}
        </h3>
        {service.description && (
          <p className="text-text-secondary text-xs leading-relaxed mb-4 flex-1 line-clamp-3">
            {service.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border-light">
          <div>
            <span className="text-gold font-medium text-sm">
              {formatCents(service.price_cents)}
            </span>
            <span className="text-text-muted text-xs ml-2">
              · {service.duration_minutes} min
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelect(service)}
            className="bg-accent text-accent-foreground text-xs font-medium px-4 py-2 rounded-full hover:bg-gold-light transition-colors duration-200"
          >
            Select
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function CrownIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" opacity={0.3}>
      <path
        d="M3 18L5 8L9 13L12 6L15 13L19 8L21 18H3Z"
        fill="currentColor"
        className="text-gold"
      />
    </svg>
  );
}
