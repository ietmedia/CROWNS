import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin((?!/login))(.*)"]);
const isClientProtected = createRouteMatcher([
  "/my-appointments(.*)",
  "/my-membership(.*)",
  "/book(.*)",
]);

export const proxy = clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname;

  if (isAdminRoute(request)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  } else if (isClientProtected(request)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
