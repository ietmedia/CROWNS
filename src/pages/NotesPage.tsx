import { FormEvent, useEffect, useMemo, useState } from "react";
import { createNote, loadNotes, Note, saveNotes } from "../lib/notes";

export function NotesPage() {
  const [text, setText] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  const stats = useMemo(() => {
    const count = notes.length;
    const last = notes[0]?.createdAt ? new Date(notes[0].createdAt) : null;
    return { count, last };
  }, [notes]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = text.trim();
    if (!next) return;
    setNotes((prev) => [createNote(next), ...prev]);
    setText("");
  }

  return (
    <div className="card">
      <div className="cardInner">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0 }}>Notes</h2>
            <div className="muted small" style={{ marginTop: 6 }}>
              {stats.count} note{stats.count === 1 ? "" : "s"}
              {stats.last ? ` • last added ${stats.last.toLocaleString()}` : ""}
            </div>
          </div>
          <button
            type="button"
            className="btn btnDanger"
            onClick={() => {
              if (notes.length === 0) return;
              // Keep UX simple: browser confirm is fine for a starter.
              if (!window.confirm("Delete all notes?")) return;
              setNotes([]);
            }}
            disabled={notes.length === 0}
            title={notes.length === 0 ? "No notes to clear" : "Clear all notes"}
          >
            Clear all
          </button>
        </div>

        <form className="formRow" onSubmit={onSubmit}>
          <input
            className="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a note…"
            maxLength={240}
            aria-label="Note text"
          />
          <button type="submit" className="btn btnPrimary">
            Add note
          </button>
        </form>

        <div className="list" role="list">
          {notes.length === 0 ? (
            <div className="muted" style={{ marginTop: 14 }}>
              No notes yet — add one above.
            </div>
          ) : (
            notes.map((n) => (
              <div className="noteItem" key={n.id} role="listitem">
                <p className="noteText">{n.text}</p>
                <button
                  type="button"
                  className="btn btnDanger"
                  onClick={() => setNotes((prev) => prev.filter((p) => p.id !== n.id))}
                  aria-label="Delete note"
                  title="Delete note"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

