import Anthropic from "@anthropic-ai/sdk";
import { createInsforgeServer } from "@/lib/insforge-server";

const SYSTEM_PROMPT = `You are Crown Concierge, the luxury AI assistant for Crowns Enchanted — a premium natural hair care salon in Marietta, GA. You embody elegance, warmth, and expert knowledge of natural hair care.

Your role:
- Help clients understand services, pricing, and what to expect
- Offer personalized hair care advice based on what clients share about their hair
- Guide clients toward booking an appointment for their specific needs
- Answer questions about the salon's philosophy, team, and memberships
- Keep all responses warm, professional, and concise (2-4 sentences max per reply)

Services offered:
- Natural Hair Care — $100, 60 min
- Scalp Rehab — $399, comprehensive scalp restoration
- Reiki Infused Hair Care — $125, holistic + hair service
- Beauty Assessment — $150, personalized consultation
- Editorial Styling — $350, high-fashion looks
- Curl Rehab — $275, curl restoration
- Hydrate + Protein Balance — $285, moisture-protein treatment
- Enchanted Cut Executive — $125, precision cut

Location: 2900 Delk Road SE, Suite 17, Marietta, GA 30067
Phone: 470-495-8894
Booking: available through the website at /book

Do NOT discuss competitor salons, make guarantees about results, or provide medical advice. Keep responses under 120 words.`;

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Crown Concierge is not yet configured." }, { status: 503 });
  }

  // Verify user is authenticated
  const insforge = await createInsforgeServer();
  const { data: { user } } = await insforge.auth.getCurrentUser();
  if (!user) {
    return Response.json({ error: "Please sign in to chat with Crown Concierge." }, { status: 401 });
  }

  let body: { messages?: { role: string; content: string }[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const messages = body.messages ?? [];
  if (!messages.length) {
    return Response.json({ error: "No messages provided." }, { status: 400 });
  }

  // Sanitize: only pass role + content, limit to last 20 messages
  const sanitized = messages
    .slice(-20)
    .filter((m) => ["user", "assistant"].includes(m.role) && typeof m.content === "string")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, 2000) }));

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: sanitized,
    });

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "";

    return Response.json({ message: text });
  } catch (err) {
    console.error("Crown Concierge error:", err);
    return Response.json(
      { error: "Crown Concierge is unavailable right now. Please try again shortly." },
      { status: 502 }
    );
  }
}
