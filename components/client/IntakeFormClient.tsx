"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitIntakeForm } from "@/actions/intake";

const HAIR_TYPES = ["Natural", "Relaxed", "Transitioning", "Color-treated", "Other"];
const HAIR_DENSITIES = ["Fine", "Medium", "Coarse"];
const HAIR_TEXTURES = ["Straight", "Wavy", "Curly", "Coily"];
const CONCERN_OPTIONS = [
  "Breakage", "Dryness", "Hair loss", "Scalp issues", "Frizz",
  "Lack of growth", "Damage", "Color fading", "Thinning",
];
const GOAL_OPTIONS = [
  "Grow longer hair", "Add moisture", "Reduce breakage", "Improve scalp health",
  "Add shine", "Define curls", "Strengthen strands", "Change color",
];

function CheckGroup({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
}) {
  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            selected.includes(opt)
              ? "bg-accent text-accent-foreground border-accent"
              : "border-border-light text-text-muted hover:border-gold hover:text-text-primary"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function RadioGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            value === opt
              ? "bg-accent text-accent-foreground border-accent"
              : "border-border-light text-text-muted hover:border-gold hover:text-text-primary"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-text-primary text-sm font-medium">{label}</p>
      {children}
    </div>
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={2}
      placeholder={placeholder}
      className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold resize-none"
    />
  );
}

export default function IntakeFormClient({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [hairType, setHairType] = useState("");
  const [hairDensity, setHairDensity] = useState("");
  const [hairTexture, setHairTexture] = useState("");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [currentProducts, setCurrentProducts] = useState("");
  const [healthConditions, setHealthConditions] = useState("");
  const [allergies, setAllergies] = useState("");
  const [lastChemical, setLastChemical] = useState("");
  const [signature, setSignature] = useState("");

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await submitIntakeForm({
        appointment_id: appointmentId,
        hair_type: hairType,
        hair_density: hairDensity,
        hair_texture: hairTexture,
        concerns,
        goals,
        current_products: currentProducts,
        health_conditions: healthConditions,
        allergies,
        last_chemical_service: lastChemical,
        signature,
      });
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/my-appointments?intake=done");
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="glass rounded-2xl p-6 space-y-6">
        <h2 className="text-text-primary font-medium text-sm uppercase tracking-widest">
          Hair Profile
        </h2>

        <Field label="Hair Type">
          <RadioGroup options={HAIR_TYPES} value={hairType} onChange={setHairType} />
        </Field>

        <Field label="Hair Density">
          <RadioGroup options={HAIR_DENSITIES} value={hairDensity} onChange={setHairDensity} />
        </Field>

        <Field label="Hair Texture">
          <RadioGroup options={HAIR_TEXTURES} value={hairTexture} onChange={setHairTexture} />
        </Field>

        <Field label="Concerns (select all that apply)">
          <CheckGroup options={CONCERN_OPTIONS} selected={concerns} onChange={setConcerns} />
        </Field>

        <Field label="Goals (select all that apply)">
          <CheckGroup options={GOAL_OPTIONS} selected={goals} onChange={setGoals} />
        </Field>
      </div>

      <div className="glass rounded-2xl p-6 space-y-6">
        <h2 className="text-text-primary font-medium text-sm uppercase tracking-widest">
          Hair & Health History
        </h2>

        <Field label="Current Products">
          <TextArea
            value={currentProducts}
            onChange={setCurrentProducts}
            placeholder="List the shampoos, conditioners, and treatments you currently use…"
          />
        </Field>

        <Field label="Last Chemical Service">
          <TextArea
            value={lastChemical}
            onChange={setLastChemical}
            placeholder="e.g. Relaxer 6 months ago, color 3 weeks ago…"
          />
        </Field>

        <Field label="Health Conditions">
          <TextArea
            value={healthConditions}
            onChange={setHealthConditions}
            placeholder="Any conditions that may affect your scalp or hair growth (optional)…"
          />
        </Field>

        <Field label="Allergies">
          <TextArea
            value={allergies}
            onChange={setAllergies}
            placeholder="Known allergies to products, fragrances, or ingredients (optional)…"
          />
        </Field>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="text-text-primary font-medium text-sm uppercase tracking-widest">
          Consent & Signature
        </h2>
        <p className="text-text-secondary text-sm">
          By signing below, I confirm that the information provided is accurate and I consent
          to the services requested. I understand Crowns Enchanted is not responsible for
          reactions to undisclosed health conditions or product allergies.
        </p>
        <div>
          <label className="block text-text-muted text-xs mb-1">Full Name (signature) *</label>
          <input
            type="text"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Type your full name to sign…"
            className="w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>
      </div>

      {error && <p className="text-error text-sm">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full bg-accent text-accent-foreground rounded-full py-3 text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
      >
        {isPending ? "Submitting…" : "Submit Intake Form"}
      </button>
    </div>
  );
}
