"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { SignInButton, Show, UserButton } from "@clerk/nextjs";

const NAV_LINKS = [
  { href: "/book", label: "Book" },
  { href: "/my-appointments", label: "My Appointments" },
  { href: "/shop", label: "Shop" },
  { href: "/my-membership", label: "Memberships" },
];

export default function ClientNavbar() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 glass border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <span className="font-display text-xl font-medium text-gradient-gold tracking-wide">
            Crowns Enchanted
          </span>
        </Link>

        {/* Nav links — desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors ${
                pathname === href || pathname.startsWith(href + "/")
                  ? "text-gold font-medium"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <Link href="/concierge">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="hidden sm:flex border border-border-gold text-gold rounded-full px-4 py-2 text-xs font-medium tracking-wide hover:glass-gold transition-all duration-300"
            >
              Crown Concierge
            </motion.button>
          </Link>

          <Show when="signed-out">
            <SignInButton mode="redirect">
              <button className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                Sign In
              </button>
            </SignInButton>
          </Show>

          <Show when="signed-in">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
          </Show>

          <Link href="/book">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="bg-accent text-accent-foreground rounded-full px-5 py-2 text-sm font-medium hover:bg-gold-light transition-all duration-300"
            >
              Book Now
            </motion.button>
          </Link>
        </div>
      </div>
    </header>
  );
}
