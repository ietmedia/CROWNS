"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { signInWithEmail } from "@/actions/auth";

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithEmail(formData);
      if (result?.error) setError(result.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background: "linear-gradient(135deg, #1A1A2E 0%, #2D0A4E 50%, #1A1A2E 100%)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(74,14,143,0.2) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="glass rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/">
              <h1 className="font-display text-2xl text-gradient-gold mb-1">
                Crowns Enchanted
              </h1>
            </Link>
            <p className="text-text-muted text-xs uppercase tracking-widest">
              Admin Portal
            </p>
          </div>

          {/* Form */}
          <form action={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-1.5">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="ashley@crownsenchanted.com"
                className="w-full bg-surface-card border border-border-light rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted/60 text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-colors"
              />
            </div>

            <div>
              <label className="block text-text-secondary text-sm font-medium mb-1.5">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-surface-card border border-border-light rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted/60 text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-colors"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-error text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              className="w-full bg-accent text-accent-foreground rounded-full py-3.5 text-sm font-medium hover:bg-gold-light disabled:opacity-60 transition-all duration-300 mt-2"
            >
              {loading ? "Signing in…" : "Sign In"}
            </motion.button>
          </form>

          <p className="text-center text-text-muted text-xs mt-6">
            <Link
              href="/"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              ← Back to site
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
