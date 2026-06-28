"use client";

import { useState } from "react";
import AdminCreateBookingModal from "./AdminCreateBookingModal";

interface Props {
  prefillDate?: string;
  prefillTime?: string;
}

export default function AdminNewBookingButton({ prefillDate, prefillTime }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all hover:scale-105"
        style={{ background: "linear-gradient(135deg, #D4A017, #F0C040)", color: "#1A1A2E" }}
      >
        <span className="text-lg leading-none">+</span>
        New Booking
      </button>

      <AdminCreateBookingModal
        open={open}
        onClose={() => setOpen(false)}
        prefillDate={prefillDate}
        prefillTime={prefillTime}
      />
    </>
  );
}
