import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Everything is walled behind a Clerk account EXCEPT this allowlist.
// The homepage stays public for SEO / first impression; the auth pages and the
// Stripe webhook (server-to-server, no user session) must stay reachable.
const isPublic = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/admin/login(.*)",
  "/api/stripe/webhook",
  "/__clerk(.*)",
]);

// Admin area: signed-in AND authorized (email allowlist checked in the layout).
const isAdminRoute = createRouteMatcher(["/admin((?!/login))(.*)"]);

export const proxy = clerkMiddleware(async (auth, request) => {
  if (isPublic(request)) return;

  const { userId } = await auth();

  if (isAdminRoute(request)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return;
  }

  // Any other route (booking, shop, gift cards, concierge, my-*, client APIs):
  // anonymous visitors are sent to sign-up, then bounced back to where they were.
  if (!userId) {
    const signUp = new URL("/sign-up", request.url);
    signUp.searchParams.set(
      "redirect_url",
      request.nextUrl.pathname + request.nextUrl.search
    );
    return NextResponse.redirect(signUp);
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
