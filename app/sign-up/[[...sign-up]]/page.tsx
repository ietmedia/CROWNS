import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{
        background: "linear-gradient(135deg, #1A1A2E 0%, #2D0A4E 50%, #1A1A2E 100%)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(123,47,190,0.2) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 w-full flex flex-col items-center">
        <Link href="/" className="mb-8">
          <span className="font-display text-3xl text-gradient-gold">
            Crowns Enchanted
          </span>
        </Link>
        <SignUp />
      </div>
    </main>
  );
}
