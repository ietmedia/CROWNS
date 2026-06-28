"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function BookingSuccess() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.4 }}
          className="glass-gold border border-border-gold rounded-2xl px-6 py-4 mb-8 flex items-center gap-4"
        >
          <span className="text-gold text-xl">✦</span>
          <div>
            <p className="text-text-primary text-sm font-medium">
              Your appointment is confirmed!
            </p>
            <p className="text-text-secondary text-xs">
              We'll be in touch with reminders as your appointment approaches.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
