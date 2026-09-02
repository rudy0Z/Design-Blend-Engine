/**
 * Theme handling. DESIGN.md requires a dark mode (deep warm charcoal), so the
 * tokens ship and the user gets a real toggle — defaulting to the OS setting.
 * Applied on the <html> element before first paint to avoid a flash.
 */
export type Theme = "light" | "dark";

const STORAGE_KEY = "designBlend.theme";

export function getTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Storage can be unavailable (private mode) — fall through to the OS.
  }
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Non-fatal: the toggle still works for this session.
  }
  applyTheme(theme);
}