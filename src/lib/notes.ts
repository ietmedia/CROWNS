export type Note = {
  id: string;
  text: string;
  createdAt: number;
};

const STORAGE_KEY = "crowns.notes";

export function loadNotes(): Note[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((n) => (typeof n === "object" && n ? n : null))
      .filter(Boolean)
      .map((n) => {
        const obj = n as Record<string, unknown>;
        return {
          id: typeof obj.id === "string" ? obj.id : crypto.randomUUID(),
          text: typeof obj.text === "string" ? obj.text : "",
          createdAt: typeof obj.createdAt === "number" ? obj.createdAt : Date.now(),
        } satisfies Note;
      })
      .filter((n) => n.text.trim().length > 0)
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export function saveNotes(notes: Note[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function createNote(text: string): Note {
  return {
    id: crypto.randomUUID(),
    text: text.trim(),
    createdAt: Date.now(),
  };
}

