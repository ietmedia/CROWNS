export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createInsforgeServer } from "@/lib/insforge-server";
import AdminSidebar from "@/components/layout/AdminSidebar";

export default async function AdminMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const insforge = await createInsforgeServer();
  const { data } = await insforge.auth.getCurrentUser();
  const profile = data?.user?.profile as Record<string, unknown> | null;
  const role = typeof profile?.role === "string" ? profile.role : null;

  if (role !== "admin") {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
