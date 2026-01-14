import { useEffect, useState } from "react";
import { getStoredTheme, Theme, toggleTheme } from "../lib/theme";

export function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const initial = typeof document !== "undefined" ? (document.documentElement.dataset.theme as Theme | undefined) : undefined;
    return initial ?? (typeof window !== "undefined" ? getStoredTheme() : "dark");
  });

  useEffect(() => {
    // Keep state in sync if something else sets the dataset theme.
    const observer = new MutationObserver(() => {
      const t = (document.documentElement.dataset.theme as Theme | undefined) ?? "dark";
      setThemeState(t);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return (
    <button
      type="button"
      className="btn"
      onClick={() => {
        const next = toggleTheme();
        setThemeState(next);
      }}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      <span aria-hidden="true">{theme === "dark" ? "☾" : "☀"}</span>
      <span className="small">{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}

