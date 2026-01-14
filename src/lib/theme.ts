export type Theme = "light" | "dark";

const STORAGE_KEY = "crowns.theme";

export function getStoredTheme(): Theme {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === "light" || raw === "dark") return raw;
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(STORAGE_KEY, theme);
}

export function toggleTheme(): Theme {
  const current = (document.documentElement.dataset.theme as Theme | undefined) ?? getStoredTheme();
  const next: Theme = current === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

