"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { insforge } from "@/lib/insforge-client";
import type { Service, Staff } from "@/types";

interface Props {
  service: Service;
  onSelect: (staff: Staff | null, choice: string) => void;
  onBack: () => void;
}

export default function Step2Staff({ service, onSelect, onBack }: Props) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    insforge.database
      .from("staff_services")
      .select("staff_id, staff!inner(id, name, role, bio, avatar_url, is_active)")
      .eq("service_id", service.id)
      .then(({ data }) => {
        const active = (data ?? [])
          .map((row: Record<string, unknown>) => row.staff as Staff)
          .filter((s) => s?.is_active);
        setStaff(active);
        setLoading(false);
      });
  }, [service.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-text-secondary text-sm hover:text-gold transition-colors mb-8"
      >
        ← Back to services
      </button>

      <div className="text-center mb-10">
        <p className="text-text-muted text-xs uppercase tracking-widest mb-2">
          {service.name}
        </p>
        <h2 className="font-display text-4xl text-text-primary mb-3">
          Choose Your Stylist
        </h2>
        <p className="text-text-secondary text-sm">
          Select a specific stylist or let us match you.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Any available option */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(null, "any")}
          className="glass-gold rounded-2xl p-6 text-left group border border-border-gold hover:glow-gold transition-all duration-300"
        >
          <div className="w-14 h-14 rounded-full bg-gold/15 border border-border-gold flex items-center justify-center mb-4">
            <span className="text-gold text-xl">✦</span>
          </div>
          <h3 className="font-display text-xl text-text-primary mb-1">
            Any Available
          </h3>
          <p className="text-text-secondary text-xs">
            We'll assign the best available stylist for your time.
          </p>
        </motion.button>

        {staff.map((s, i) => (
          <StaffCard
            key={s.id}
            staff={s}
            index={i + 1}
            onSelect={() => onSelect(s, s.id)}
          />
        ))}
      </div>
    </div>
  );
}

function StaffCard({
  staff,
  index,
  onSelect,
}: {
  staff: Staff;
  index: number;
  onSelect: () => void;
}) {
  const roleLabel: Record<string, string> = {
    stylist: "Hair Stylist",
    colorist: "Colorist",
    nail_tech: "Nail Technician",
    esthetician: "Esthetician",
    other: "Specialist",
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className="glass rounded-2xl p-6 text-left hover:border-border-gold transition-all duration-300"
    >
      <div className="w-14 h-14 rounded-full bg-surface-elevated overflow-hidden mb-4">
        {staff.avatar_url ? (
          <img
            src={staff.avatar_url}
            alt={staff.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-xl">
            {staff.name.charAt(0)}
          </div>
        )}
      </div>
      <h3 className="font-display text-xl text-text-primary mb-0.5">
        {staff.name}
      </h3>
      <p className="text-gold text-xs font-medium mb-2">
        {roleLabel[staff.role] ?? staff.role}
      </p>
      {staff.bio && (
        <p className="text-text-secondary text-xs leading-relaxed line-clamp-2">
          {staff.bio}
        </p>
      )}
    </motion.button>
  );
}
