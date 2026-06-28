"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

const SERVICES = [
  { icon: "🌿", title: "Natural Hair Care", price: "From $100", color: "#0D9488" },
  { icon: "✨", title: "Scalp Rehab", price: "From $399", color: "#7B2FBE" },
  { icon: "🔮", title: "Reiki Infused Services", price: "From $125", color: "#D4A017" },
  { icon: "👑", title: "Beauty Assessment", price: "$150", color: "#A855F7" },
  { icon: "🎬", title: "Editorial Styling", price: "From $350", color: "#2DD4BF" },
  { icon: "💫", title: "Curl Rehab", price: "From $275", color: "#D4A017" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function ServicesPreview() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="relative py-32 px-6"
      style={{ background: "#1A1A2E" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p
            className="text-xs uppercase tracking-widest mb-6"
            style={{ color: "#D4A017" }}
          >
            What We Offer
          </p>
          <h2
            className="font-display"
            style={{
              fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
              color: "#FDF8F0",
            }}
          >
            Heal from the{" "}
            <span className="text-gradient-gold italic">Root</span>
          </h2>
        </motion.div>

        {/* Service cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {SERVICES.map((service) => (
            <motion.div key={service.title} variants={item}>
              <Link href="/book">
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="glass rounded-2xl p-10 h-full cursor-pointer text-center group relative overflow-hidden"
                >
                  {/* Color accent glow on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                    style={{
                      background: `radial-gradient(ellipse at center, ${service.color}15 0%, transparent 70%)`,
                    }}
                  />
                  <div className="relative z-10">
                    <div className="text-5xl mb-6">{service.icon}</div>
                    <h3
                      className="font-display text-2xl mb-4"
                      style={{ color: "#FDF8F0" }}
                    >
                      {service.title}
                    </h3>
                    <span
                      className="font-display text-lg"
                      style={{ color: service.color }}
                    >
                      {service.price}
                    </span>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* View all CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-16"
        >
          <Link href="/book">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="glass px-10 py-4 rounded-full text-sm tracking-widest uppercase transition-all"
              style={{ color: "#D4A017" }}
            >
              Book a Service →
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
