import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAuthActions } from "@insforge/sdk/ssr";
import { createInsforgeServer } from "@/lib/insforge-server";
import { createInsforgeAdmin } from "@/lib/insforge-admin";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("insforge_code");
  const oauthError = searchParams.get("error");

  if (oauthError || !code) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  }

  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get("insforge_code_verifier")?.value;

  if (!codeVerifier) {
    return NextResponse.redirect(new URL("/login?error=missing_verifier", request.url));
  }

  const response = NextResponse.redirect(new URL("/book", request.url));
  const auth = createAuthActions({
    requestCookies: request.cookies,
    responseCookies: response.cookies,
  });

  const { data, error } = await auth.exchangeOAuthCode(code, codeVerifier);

  if (error || !data?.user) {
    return NextResponse.redirect(new URL("/login?error=exchange_failed", request.url));
  }

  response.cookies.delete("insforge_code_verifier");

  // Set role = 'client' and create clients row on first login
  const profile = data.user.profile as Record<string, string> | null;
  if (!profile?.role) {
    // setProfile uses the server client — auth tokens land on response.cookies, not
    // the request cookie store, so this may silently fail on the very first OAuth
    // callback. Client routes don't require a role, so this is non-blocking.
    try {
      const insforge = await createInsforgeServer();
      await insforge.auth.setProfile({ role: "client" });
    } catch {
      // acceptable — role will be absent until next sign-in refreshes the session
    }

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
          full_name: profile?.name ?? data.user.email ?? "Guest",
          preferred_channel: "email",
        },
      ]);
    }
  }

  return response;
}
