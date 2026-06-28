"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ClientNavbar from "@/components/layout/ClientNavbar";
import Step1Services from "@/components/booking/Step1Services";
import Step2Staff from "@/components/booking/Step2Staff";
import Step3DateTime from "@/components/booking/Step3DateTime";
import Step4Confirm from "@/components/booking/Step4Confirm";
import type { Service, Staff } from "@/types";

interface BookingState {
  service: Service | null;
  staff: Staff | null;
  staffIdChoice: string; // specific uuid or 'any'
  startTime: string | null;
  endTime: string | null;
}

const STEPS = [
  { label: "Service" },
  { label: "Staff" },
  { label: "Time" },
  { label: "Confirm" },
];

export default function BookPage() {
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState<BookingState>({
    service: null,
    staff: null,
    staffIdChoice: "any",
    startTime: null,
    endTime: null,
  });

  function handleServiceSelect(service: Service) {
    setBooking((b) => ({ ...b, service }));
    setStep(2);
  }

  function handleStaffSelect(staff: Staff | null, choice: string) {
    setBooking((b) => ({ ...b, staff, staffIdChoice: choice }));
    setStep(3);
  }

  function handleTimeSelect(startTime: string, endTime: string) {
    setBooking((b) => ({ ...b, startTime, endTime }));
    setStep(4);
  }

  function goBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientNavbar />

      <div className="pt-24 pb-16 px-6 max-w-4xl mx-auto">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-12">
          {STEPS.map((s, i) => {
            const num = i + 1;
            const isActive = num === step;
            const isDone = num < step;
            return (
              <div key={s.label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : isDone
                        ? "bg-accent/30 text-gold border border-border-gold"
                        : "bg-surface-card text-text-muted border border-border-light"
                    }`}
                  >
                    {isDone ? "✓" : num}
                  </div>
                  <span
                    className={`text-xs mt-1.5 font-medium transition-colors ${
                      isActive
                        ? "text-gold"
                        : isDone
                        ? "text-text-secondary"
                        : "text-text-muted"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-16 h-px mx-2 mb-5 transition-colors duration-300 ${
                      num < step ? "bg-border-gold" : "bg-border-light"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {step === 1 && (
            <Step1Services onSelect={handleServiceSelect} />
          )}
          {step === 2 && booking.service && (
            <Step2Staff
              service={booking.service}
              onSelect={handleStaffSelect}
              onBack={goBack}
            />
          )}
          {step === 3 && booking.service && (
            <Step3DateTime
              service={booking.service}
              staffIdChoice={booking.staffIdChoice}
              onSelect={handleTimeSelect}
              onBack={goBack}
            />
          )}
          {step === 4 && booking.service && booking.startTime && booking.endTime && (
            <Step4Confirm
              service={booking.service}
              staff={booking.staff}
              staffIdChoice={booking.staffIdChoice}
              startTime={booking.startTime}
              endTime={booking.endTime}
              onBack={goBack}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
