import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function AdminLoginPage() {
  return (
    <main
      style={{
        background: "linear-gradient(135deg, #1A1A2E 0%, #2D0A4E 50%, #1A1A2E 100%)",
      }}
      className="min-h-screen flex flex-col items-center justify-center px-6"
    >
      <div className="relative z-10 w-full flex flex-col items-center">
        <div className="text-center mb-6">
          <Link href="/">
            <span className="font-display text-3xl text-gradient-gold">Crowns Enchanted</span>
          </Link>
          <p className="text-text-muted text-xs uppercase tracking-widest mt-1">Admin Portal</p>
        </div>
        <SignIn forceRedirectUrl="/admin/dashboard" />
        <p className="mt-6 text-text-muted text-xs">
          <Link href="/" className="text-text-secondary hover:text-text-primary transition-colors">
            ← Back to site
          </Link>
        </p>
      </div>
    </main>
  );
}
