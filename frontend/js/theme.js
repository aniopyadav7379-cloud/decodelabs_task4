/**
 * theme.js
 * Small light/dark toggle. Preference persists across visits via
 * localStorage; falls back to the OS-level preference on first visit.
 */

const STORAGE_KEY = "interns_directory_theme";

function systemPrefersDark() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

export function getTheme() {
  return localStorage.getItem(STORAGE_KEY) || (systemPrefersDark() ? "dark" : "light");
}

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

export function toggleTheme() {
  const next = getTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}

// Apply immediately on import so there's no flash of the wrong theme.
applyTheme(getTheme());
