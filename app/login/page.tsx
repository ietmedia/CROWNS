"use client";

import { useState, useTransition, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  signInWithGoogle,
  signInWithEmailClient,
  signUpWithEmail,
  verifyEmailOtp,
  sendPasswordReset,
  confirmPasswordReset,
} from "@/actions/auth";

type Mode = "signin" | "signup" | "verify" | "forgot" | "reset";

const URL_ERRORS: Record<string, string> = {
  oauth_failed: "Google sign-in failed. Please try email instead.",
  missing_verifier: "Session expired. Please try signing in again.",
  exchange_failed: "Could not complete Google sign-in. Please try again.",
};

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError && URL_ERRORS[urlError]) setError(URL_ERRORS[urlError]);
  }, [searchParams]);

  function handleSignIn(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await signInWithEmailClient(formData);
      if (result?.error) setError(result.error);
    });
  }

  function handleForgot(formData: FormData) {
    setError("");
    const emailVal = formData.get("email") as string;
    startTransition(async () => {
      const result = await sendPasswordReset(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setEmail(emailVal);
        setMode("reset");
      }
    });
  }

  function handleReset(formData: FormData) {
    setError("");
    formData.set("email", email);
    startTransition(async () => {
      const result = await confirmPasswordReset(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setMode("signin");
        setError("");
      }
    });
  }

  function handleSignUp(formData: FormData) {
    setError("");
    const emailVal = formData.get("email") as string;
    startTransition(async () => {
      const result = await signUpWithEmail(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setEmail(emailVal);
        setMode("verify");
      }
    });
  }

  function handleVerify(formData: FormData) {
    setError("");
    formData.set("email", email);
    startTransition(async () => {
      const result = await verifyEmailOtp(formData);
      if (result?.error) setError(result.error);
    });
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
            "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(123,47,190,0.2) 0%, transparent 70%)",
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
              <h1 className="font-display text-2xl text-gradient-gold mb-2">
                Crowns Enchanted
              </h1>
            </Link>
            <p className="text-text-secondary text-sm">
              {mode === "verify"
                ? "Check your email for a code"
                : mode === "signup"
                ? "Create your account"
                : mode === "forgot"
                ? "Reset your password"
                : mode === "reset"
                ? "Enter your reset code"
                : "Sign in to book your appointment"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {mode === "forgot" ? (
              /* Forgot Password — enter email */
              <motion.form
                key="forgot"
                action={handleForgot}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-text-secondary text-sm text-center mb-5">
                  Enter your email and we&apos;ll send a reset code.
                </p>
                <div className="mb-5">
                  <label className="text-text-secondary text-sm font-medium block mb-1.5">Email</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="w-full bg-surface-card border border-border-light rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold"
                  />
                </div>
                {error && <p className="text-error text-xs text-center mb-4">{error}</p>}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-accent text-accent-foreground rounded-full py-3.5 text-sm font-medium hover:bg-gold-light transition-all duration-300 disabled:opacity-60"
                >
                  {isPending ? "Sending…" : "Send Reset Code"}
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("signin"); setError(""); }}
                  className="w-full text-center text-text-muted text-xs mt-4 hover:text-text-secondary transition-colors"
                >
                  ← Back to sign in
                </button>
              </motion.form>
            ) : mode === "reset" ? (
              /* Reset Password — enter code + new password */
              <motion.form
                key="reset"
                action={handleReset}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-text-secondary text-sm text-center mb-5">
                  Code sent to <span className="text-gold font-medium">{email}</span>
                </p>
                <div className="mb-4">
                  <label className="text-text-secondary text-sm font-medium block mb-1.5">Reset code</label>
                  <input
                    name="code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    required
                    className="w-full bg-surface-card border border-border-light rounded-lg px-4 py-3 text-text-primary text-center tracking-[0.3em] text-lg placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold"
                  />
                </div>
                <div className="mb-5">
                  <label className="text-text-secondary text-sm font-medium block mb-1.5">New password</label>
                  <input
                    name="newPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full bg-surface-card border border-border-light rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold"
                  />
                </div>
                {error && <p className="text-error text-xs text-center mb-4">{error}</p>}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-accent text-accent-foreground rounded-full py-3.5 text-sm font-medium hover:bg-gold-light transition-all duration-300 disabled:opacity-60"
                >
                  {isPending ? "Updating…" : "Set New Password"}
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("forgot"); setError(""); }}
                  className="w-full text-center text-text-muted text-xs mt-4 hover:text-text-secondary transition-colors"
                >
                  Resend code
                </button>
              </motion.form>
            ) : mode === "verify" ? (
              /* OTP Verification */
              <motion.form
                key="verify"
                action={handleVerify}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-text-secondary text-sm text-center mb-5">
                  We sent a code to{" "}
                  <span className="text-gold font-medium">{email}</span>
                </p>
                <div className="mb-4">
                  <label className="text-text-secondary text-sm font-medium block mb-1.5">
                    Verification code
                  </label>
                  <input
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    required
                    className="w-full bg-surface-card border border-border-light rounded-lg px-4 py-3 text-text-primary text-center tracking-[0.3em] text-lg placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold"
                  />
                </div>

                {error && (
                  <p className="text-error text-xs text-center mb-4">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-accent text-accent-foreground rounded-full py-3.5 text-sm font-medium hover:bg-gold-light transition-all duration-300 disabled:opacity-60"
                >
                  {isPending ? "Verifying…" : "Verify & Continue"}
                </button>

                <button
                  type="button"
                  onClick={() => { setMode("signup"); setError(""); }}
                  className="w-full text-center text-text-muted text-xs mt-4 hover:text-text-secondary transition-colors"
                >
                  Didn't receive it? Go back
                </button>
              </motion.form>
            ) : (
              /* Sign In / Sign Up */
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === "signup" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "signup" ? -20 : 20 }}
                transition={{ duration: 0.25 }}
              >
                {/* Tab toggle */}
                <div className="flex rounded-full border border-border-light p-1 mb-6">
                  {(["signin", "signup"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setMode(m); setError(""); }}
                      className={`flex-1 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                        mode === m
                          ? "bg-accent text-accent-foreground"
                          : "text-text-muted hover:text-text-secondary"
                      }`}
                    >
                      {m === "signin" ? "Sign In" : "Create Account"}
                    </button>
                  ))}
                </div>

                {/* Email / Password form */}
                <form action={mode === "signin" ? handleSignIn : handleSignUp}>
                  <div className="mb-4">
                    <label className="text-text-secondary text-sm font-medium block mb-1.5">
                      Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      className="w-full bg-surface-card border border-border-light rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold"
                    />
                  </div>
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-text-secondary text-sm font-medium">Password</label>
                      {mode === "signin" && (
                        <button
                          type="button"
                          onClick={() => { setMode("forgot"); setError(""); }}
                          className="text-text-muted text-xs hover:text-gold transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="w-full bg-surface-card border border-border-light rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold"
                    />
                  </div>

                  {error && (
                    <p className="text-error text-xs text-center mb-4">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-accent text-accent-foreground rounded-full py-3.5 text-sm font-medium hover:bg-gold-light transition-all duration-300 disabled:opacity-60"
                  >
                    {isPending
                      ? mode === "signin"
                        ? "Signing in…"
                        : "Creating account…"
                      : mode === "signin"
                      ? "Sign In"
                      : "Create Account"}
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 my-5">
                  <div className="flex-1 h-px bg-border-light" />
                  <span className="text-text-muted text-xs">or</span>
                  <div className="flex-1 h-px bg-border-light" />
                </div>

                {/* Google */}
                <form action={signInWithGoogle}>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center justify-center gap-3 border border-border-light text-text-secondary rounded-full py-3 text-sm font-medium hover:border-border-gold hover:text-gold transition-all duration-300"
                  >
                    <GoogleIcon />
                    Continue with Google
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer link */}
          <p className="text-center text-text-secondary text-xs mt-6">
            Not ready yet?{" "}
            <Link href="/" className="text-gold hover:text-gold-light transition-colors">
              Return to site
            </Link>
          </p>
        </div>

        <p className="text-center text-text-muted text-xs mt-6">
          Salon staff?{" "}
          <Link
            href="/admin/login"
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            Admin sign in →
          </Link>
        </p>
      </motion.div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
