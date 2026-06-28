"use client";

import { useState, useTransition } from "react";
import { submitReview } from "@/actions/reviews";

export default function ReviewForm({
  appointmentId,
  staffId,
  serviceId,
  onSuccess,
}: {
  appointmentId: string;
  staffId: string;
  serviceId: string;
  onSuccess: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitReview({
        appointmentId,
        staffId,
        serviceId,
        rating,
        comment,
      });
      if (result.error) {
        setError(result.error);
      } else {
        onSuccess();
      }
    });
  }

  const display = hovered || rating;

  return (
    <div className="mt-4 pt-4 border-t border-border-light space-y-3">
      <p className="text-text-secondary text-xs font-medium uppercase tracking-widest">
        Leave a Review
      </p>

      {/* Stars */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-2xl leading-none transition-transform hover:scale-110 focus:outline-none"
            aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
          >
            <span className={star <= display ? "text-gold" : "text-text-muted/30"}>
              ★
            </span>
          </button>
        ))}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Share your experience (optional)…"
        className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold resize-none"
      />

      {error && <p className="text-error text-xs">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={isPending || rating === 0}
        className="bg-accent text-accent-foreground rounded-full px-5 py-2 text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
      >
        {isPending ? "Submitting…" : "Submit Review"}
      </button>
    </div>
  );
}
