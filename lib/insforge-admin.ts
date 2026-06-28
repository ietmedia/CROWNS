// Admin (service-role) client — bypasses RLS. Server-only. Never import in client components.
import { createAdminClient } from "@insforge/sdk";

export const createInsforgeAdmin = () =>
  createAdminClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    apiKey: process.env.INSFORGE_API_KEY!,
  });
