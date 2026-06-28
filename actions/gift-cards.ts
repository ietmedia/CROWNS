"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeAdmin } from "@/lib/insforge-admin";
import { createInsforgeServer } from "@/lib/insforge-server";

export type GiftCard = {
  id: string;
  code: string;
  amount_cents: number;
  balance_cents: number;
  purchased_by: string | null;
  recipient_email: string | null;
  message: string | null;
  expires_at: string | null;
  created_at: string;
};

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  let code = "";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

// ─── Client: purchase ─────────────────────────────────────────────────────────

export async function purchaseGiftCard(input: {
  amount_cents: number;
  recipient_email: string;
  message: string;
}) {
  if (input.amount_cents < 1000) return { error: "Minimum gift card amount is $10." };

  const insforge = await createInsforgeServer();
  const { data: { user } } = await insforge.auth.getCurrentUser();
  if (!user) return { error: "Please sign in to purchase a gift card." };

  const code = generateCode();
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const { error } = await insforge.database.from("gift_cards").insert([
    {
      code,
      amount_cents: input.amount_cents,
      balance_cents: input.amount_cents,
      purchased_by: user.id,
      recipient_email: input.recipient_email.trim() || null,
      message: input.message.trim() || null,
      expires_at: expiresAt.toISOString(),
    },
  ]);
  if (error) return { error: error.message };
  revalidatePath("/gift-cards");
  return { success: true, code };
}

export async function getMyGiftCards() {
  const insforge = await createInsforgeServer();
  const { data: { user } } = await insforge.auth.getCurrentUser();
  if (!user) return { data: [] };

  const { data } = await insforge.database
    .from("gift_cards")
    .select("id, code, amount_cents, balance_cents, recipient_email, message, expires_at, created_at")
    .eq("purchased_by", user.id)
    .order("created_at", { ascending: false });

  return { data: (data ?? []) as GiftCard[] };
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function getAllGiftCards(filters: { search?: string } = {}) {
  const insforge = createInsforgeAdmin();
  let query = insforge.database
    .from("gift_cards")
    .select("id, code, amount_cents, balance_cents, purchased_by, recipient_email, message, expires_at, created_at, clients(id, full_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (filters.search) {
    query = query.ilike("code", `%${filters.search}%`);
  }

  const { data } = await query;
  return {
    data: (data ?? []) as unknown as Array<GiftCard & {
      clients: { id: string; full_name: string } | null;
    }>,
  };
}

export async function adminCreateGiftCard(input: {
  amount_cents: number;
  recipient_email: string;
  message: string;
}) {
  if (input.amount_cents < 100) return { error: "Amount must be at least $1." };
  const insforge = createInsforgeAdmin();
  const code = generateCode();
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const { error } = await insforge.database.from("gift_cards").insert([
    {
      code,
      amount_cents: input.amount_cents,
      balance_cents: input.amount_cents,
      recipient_email: input.recipient_email.trim() || null,
      message: input.message.trim() || null,
      expires_at: expiresAt.toISOString(),
    },
  ]);
  if (error) return { error: error.message };
  revalidatePath("/admin/gift-cards");
  return { success: true, code };
}

export async function adjustGiftCardBalance(id: string, newBalance: number) {
  const insforge = createInsforgeAdmin();
  const { error } = await insforge.database
    .from("gift_cards")
    .update({ balance_cents: Math.max(0, newBalance) })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/gift-cards");
  return { success: true };
}
