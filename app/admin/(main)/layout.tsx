export const dynamic = "force-dynamic";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/layout/AdminSidebar";

// Admins are identified by an env allowlist of email addresses. A
// `publicMetadata.role === "admin"` value set in the Clerk Dashboard is also
// honoured, so either mechanism grants access.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export default async function AdminMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/admin/login");
  }

  let isAdmin = false;
  try {
    const user = await currentUser();
    const emails = (user?.emailAddresses ?? [])
      .map((entry) => entry.emailAddress?.toLowerCase())
      .filter((email): email is string => Boolean(email));
    const hasAdminRole =
      (user?.publicMetadata as { role?: string } | undefined)?.role === "admin";

    isAdmin = hasAdminRole || emails.some((email) => ADMIN_EMAILS.includes(email));
  } catch {
    // A transient Clerk Backend API failure should not 500 the admin area —
    // fall through to the not-authorized redirect below.
    isAdmin = false;
  }

  if (!isAdmin) {
    // Redirect to the site root, not /admin/login: the login page bounces any
    // active Clerk session straight back here, which would loop.
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
