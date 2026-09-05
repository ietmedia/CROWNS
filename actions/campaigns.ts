"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/current-user";

export type CampaignRow = {
  id: string;
  name: string;
  subject: string;
  body_template: string;
  segment: string;
  channel: string;
  status: string;
  sent_at: string | null;
  sent_count: number;
  created_by: string;
  created_at: string;
};

export async function getCampaigns(): Promise<{ data: CampaignRow[]; error: string | null }> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  return { data: (data ?? []) as CampaignRow[], error: error?.message ?? null };
}

export async function createCampaign(input: {
  name: string;
  subject: string;
  body_template: string;
  segment: string;
  channel: string;
}): Promise<{ data: CampaignRow | null; error: string | null }> {
  if (!input.name.trim()) return { data: null, error: "Campaign name is required." };
  if (!input.subject.trim()) return { data: null, error: "Subject is required." };
  if (!input.body_template.trim()) return { data: null, error: "Message body is required." };

  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated." };

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("campaigns")
    .insert([{
      name: input.name.trim(),
      subject: input.subject.trim(),
      body_template: input.body_template.trim(),
      segment: input.segment,
      channel: input.channel,
      status: "draft",
      sent_count: 0,
      created_by: user.id,
    }])
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  revalidatePath("/admin/campaigns");
  return { data: data as CampaignRow, error: null };
}

export async function updateCampaignStatus(
  id: string,
  status: "draft" | "approved"
): Promise<{ error: string | null }> {
  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("campaigns")
    .update({ status })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/campaigns");
  return { error: null };
}

export async function deleteCampaign(id: string): Promise<{ error: string | null }> {
  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/campaigns");
  return { error: null };
}
