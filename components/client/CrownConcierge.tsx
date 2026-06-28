"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const STARTERS = [
  "What services do you offer for natural hair?",
  "Which service is right for me if I have 4C hair?",
  "Tell me about the Scalp Rehab service",
  "How does the membership program work?",
];

export default function CrownConcierge() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome to Crowns Enchanted! I'm Crown Concierge, your personal luxury hair care advisor. How can I help you today? I can tell you about our services, guide you toward the right treatment for your hair, or help you get ready to book.",
    },
  ]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        const data = await res.json();
        if (data.error) {
          setError(data.error);
          return;
        }
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: data.message },
        ]);
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex flex-col flex-1 glass rounded-2xl overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[400px] max-h-[60vh]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-accent text-accent-foreground rounded-br-sm"
                  : "bg-surface-elevated text-text-primary rounded-bl-sm"
              }`}
            >
              {msg.role === "assistant" && (
                <p className="text-gold text-xs font-medium mb-1 uppercase tracking-widest">
                  Crown Concierge
                </p>
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isPending && (
          <div className="flex justify-start">
            <div className="bg-surface-elevated rounded-2xl rounded-bl-sm px-4 py-3">
              <p className="text-gold text-xs font-medium mb-1 uppercase tracking-widest">
                Crown Concierge
              </p>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-gold/50 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <p className="text-error text-xs bg-error/10 rounded-lg px-3 py-2">{error}</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Starters (only show when just the welcome message) */}
      {messages.length === 1 && (
        <div className="px-5 pb-3 flex flex-wrap gap-2">
          {STARTERS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              disabled={isPending}
              className="text-xs border border-border-light text-text-muted rounded-full px-3 py-1.5 hover:border-gold hover:text-text-primary transition-all disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-4 flex gap-3 items-end">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask about services, hair care, booking…"
          disabled={isPending}
          className="flex-1 bg-surface border border-border-light rounded-xl px-4 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold resize-none disabled:opacity-50"
          style={{ minHeight: "40px", maxHeight: "120px" }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isPending || !input.trim()}
          className="bg-accent text-accent-foreground rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50 shrink-0"
        >
          Send
        </button>
      </div>

      <div className="px-5 pb-4 text-center">
        <Link
          href="/book"
          className="text-gold text-xs hover:text-gold-light transition-colors"
        >
          Ready to book? →
        </Link>
      </div>
    </div>
  );
}
