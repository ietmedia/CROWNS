"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

const STEPS = [
  {
    number: "01",
    title: "Choose Your Service",
    description:
      "Browse our holistic menu — from Scalp Rehab to Reiki Infused treatments. Each service is designed to heal, not just style.",
    color: "#D4A017",
  },
  {
    number: "02",
    title: "Book with Ease",
    description:
      "Select your preferred stylist, pick a date and time, and secure your spot online. Deposits hold your appointment.",
    color: "#7B2FBE",
  },
  {
    number: "03",
    title: "Transform & Thrive",
    description:
      "Arrive and experience the ritual. Leave with a crown that reflects your authentic self — inside and out.",
    color: "#0D9488",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.2 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7 } },
};

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-32 px-6 bg-background">
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
            The Experience
          </p>
          <h2
            className="font-display"
            style={{
              fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
              color: "#FDF8F0",
            }}
          >
            How It{" "}
            <span className="text-gradient-gold italic">Works</span>
          </h2>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={container}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"
        >
          {STEPS.map((step, i) => (
            <motion.div key={step.number} variants={item}>
              <div className="glass-gold rounded-2xl p-8 h-full relative overflow-hidden">
                {/* Step number watermark */}
                <div
                  className="absolute -top-4 -right-2 font-display font-bold pointer-events-none select-none"
                  style={{
                    fontSize: "7rem",
                    color: step.color,
                    opacity: 0.07,
                    lineHeight: 1,
                  }}
                >
                  {step.number}
                </div>

                <div className="relative z-10">
                  <div
                    className="text-sm font-medium mb-4 tracking-widest uppercase"
                    style={{ color: step.color }}
                  >
                    Step {i + 1}
                  </div>
                  <h3
                    className="font-display text-2xl mb-4"
                    style={{ color: "#FDF8F0" }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="text-center"
        >
          <p
            className="font-display text-2xl mb-8"
            style={{ color: "#FDF8F0" }}
          >
            Ready to begin your{" "}
            <span className="text-gradient-gold italic">journey?</span>
          </p>
          <Link href="/book">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(212,160,23,0.3)" }}
              whileTap={{ scale: 0.97 }}
              className="px-12 py-4 rounded-full font-medium tracking-wide text-sm"
              style={{
                background: "linear-gradient(135deg, #D4A017, #F0C040)",
                color: "#1A1A2E",
              }}
            >
              Book Your Appointment
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
