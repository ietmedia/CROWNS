"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createAuthActions } from "@insforge/sdk/ssr";
import { createInsforgeServer } from "@/lib/insforge-server";
import { createInsforgeAdmin } from "@/lib/insforge-admin";

export async function signInWithGoogle() {
  const cookieStore = await cookies();
  const auth = createAuthActions({ cookies: cookieStore });

  const { data, error } = await auth.signInWithOAuth("google", {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    skipBrowserRedirect: true,
  });

  if (error || !data?.url || !data?.codeVerifier) {
    redirect("/login?error=oauth_failed");
  }

  cookieStore.set("insforge_code_verifier", data.codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  redirect(data.url);
}

export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const cookieStore = await cookies();
  const auth = createAuthActions({ cookies: cookieStore });

  const { data, error } = await auth.signInWithPassword({ email, password });

  if (error || !data?.user) {
    return { error: "Invalid email or password." };
  }

  const role = (data.user.profile as Record<string, string> | null)?.role;
  if (role !== "admin") {
    await auth.signOut();
    return { error: "Access denied. Admin credentials required." };
  }

  redirect("/admin/dashboard");
}

export async function signInWithEmailClient(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const cookieStore = await cookies();
  const auth = createAuthActions({ cookies: cookieStore });

  const { data, error } = await auth.signInWithPassword({ email, password });

  if (error || !data?.user) {
    return { error: "Invalid email or password." };
  }

  redirect("/book");
}

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const cookieStore = await cookies();
  const auth = createAuthActions({ cookies: cookieStore });

  const { error } = await auth.signUp({ email, password });

  if (error) {
    return { error: error.message ?? "Sign up failed. Please try again." };
  }

  return { success: true };
}

export async function verifyEmailOtp(formData: FormData) {
  const email = formData.get("email") as string;
  const otp = formData.get("otp") as string;

  const cookieStore = await cookies();
  const auth = createAuthActions({ cookies: cookieStore });

  const { data, error } = await auth.verifyEmail({ email, otp });

  if (error || !data?.user) {
    return { error: "Invalid or expired code. Please try again." };
  }

  const insforge = await createInsforgeServer();
  await insforge.auth.setProfile({ role: "client" });

  // Use admin client — clients table has no INSERT RLS policy for authenticated users
  const admin = createInsforgeAdmin();
  const { data: rows } = await admin.database
    .from("clients")
    .select("id")
    .eq("id", data.user.id);
  if (!rows || rows.length === 0) {
    await admin.database.from("clients").insert([
      {
        id: data.user.id,
        email: data.user.email ?? "",
        full_name: data.user.email?.split("@")[0] ?? "Guest",
        preferred_channel: "email",
      },
    ]);
  }

  redirect("/book");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtendedAuthActions = ReturnType<typeof createAuthActions> & Record<string, any>;

export async function sendPasswordReset(formData: FormData) {
  const email = formData.get("email") as string;
  if (!email) return { error: "Email is required." };

  const cookieStore = await cookies();
  const auth = createAuthActions({ cookies: cookieStore }) as ExtendedAuthActions;
  const { error } = await auth.sendResetPasswordEmail({ email });

  if (error) return { error: "Could not send reset code. Check your email address." };
  return { success: true };
}

export async function confirmPasswordReset(formData: FormData) {
  const email = formData.get("email") as string;
  const code = formData.get("code") as string;
  const newPassword = formData.get("newPassword") as string;

  if (!email || !code || !newPassword) return { error: "All fields are required." };
  if (newPassword.length < 8) return { error: "Password must be at least 8 characters." };

  const cookieStore = await cookies();
  const auth = createAuthActions({ cookies: cookieStore }) as ExtendedAuthActions;

  const { data: tokenData, error: tokenError } = await auth.exchangeResetPasswordToken({
    email,
    code,
  });

  if (tokenError || !tokenData?.token) {
    return { error: "Invalid or expired code. Please request a new one." };
  }

  const { error: resetError } = await auth.resetPassword({
    newPassword,
    otp: tokenData.token,
  });

  if (resetError) return { error: "Failed to update password. Please try again." };
  return { success: true };
}

export async function signOut() {
  const cookieStore = await cookies();
  const auth = createAuthActions({ cookies: cookieStore });
  await auth.signOut();
  redirect("/");
}

export async function getNavUser(): Promise<{ name: string; email: string } | null> {
  try {
    const insforge = await createInsforgeServer();
    const { data: { user } } = await insforge.auth.getCurrentUser();
    if (!user) return null;
    const profile = user.profile as Record<string, string> | null;
    const name = profile?.name ?? user.email?.split("@")[0] ?? "Account";
    return { name, email: user.email ?? "" };
  } catch {
    return null;
  }
}
