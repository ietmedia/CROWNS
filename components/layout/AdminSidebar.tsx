"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/actions/auth";

const SECTIONS = [
  {
    label: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Dashboard" },
      { href: "/admin/calendar", label: "Calendar" },
      { href: "/admin/bookings", label: "Bookings" },
    ],
  },
  {
    label: "Clients",
    items: [
      { href: "/admin/clients", label: "Client List" },
      { href: "/admin/campaigns", label: "Campaigns" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/services", label: "Services" },
      { href: "/admin/staff", label: "Staff" },
      { href: "/admin/inventory", label: "Inventory" },
      { href: "/admin/payroll", label: "Payroll" },
    ],
  },
  {
    label: "Revenue",
    items: [
      { href: "/admin/reports", label: "Reports" },
      { href: "/admin/memberships", label: "Memberships" },
      { href: "/admin/gift-cards", label: "Gift Cards" },
      { href: "/admin/shop", label: "Shop" },
    ],
  },
  {
    label: "System",
    items: [{ href: "/admin/settings", label: "Settings" }],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="w-60 min-h-screen bg-surface border-r border-border flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border">
        <span className="font-display text-lg text-gradient-gold">
          Crowns Enchanted
        </span>
        <p className="text-text-muted text-xs mt-0.5">Admin Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="text-text-muted text-xs uppercase tracking-widest px-4 pt-4 pb-1">
              {section.label}
            </p>
            {section.items.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center px-4 py-2 text-sm transition-colors ${
                  isActive(href)
                    ? "text-gold bg-gold/10 border-l-2 border-gold"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated border-l-2 border-transparent"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-4 py-4 border-t border-border">
        <form action={signOut}>
          <button
            type="submit"
            className="w-full text-left text-sm text-text-secondary hover:text-error transition-colors"
          >
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
