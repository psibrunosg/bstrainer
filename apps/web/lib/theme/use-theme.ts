"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "bstrainer-theme";

export function resolveTheme(
  stored: string | null,
  prefersDark: boolean,
): ResolvedTheme {
  if (stored === "light" || stored === "dark") return stored;
  return prefersDark ? "dark" : "light";
}

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "light" || raw === "dark" ? raw : "system";
  } catch {
    // localStorage can throw (private mode, disabled storage, etc.); fall
    // back to the system preference rather than crashing the hook.
    return "system";
  }
}

export function useTheme() {
  // Lazily initialize from the stored preference so the very first render
  // (and the very first run of the effect below) already has the correct
  // value. Defaulting to "system" and correcting it in a mount-only effect
  // caused a race: both effects run in the same initial commit, so the
  // data-theme effect would apply the OS preference before the stored
  // preference had a chance to load, producing a flash of the wrong theme.
  const [preference, setPreference] = useState<ThemePreference>(() =>
    readStoredPreference(),
  );

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const stored =
        preference === "system" ? null : preference;
      const resolved = resolveTheme(stored, mql.matches);
      document.documentElement.setAttribute("data-theme", resolved);
    };
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, [preference]);

  const setTheme = useCallback((next: ThemePreference) => {
    setPreference(next);
    try {
      if (next === "system") {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, next);
      }
    } catch {
      // Storage write failures (quota exceeded, private mode, disabled
      // storage) shouldn't crash the hook; the in-memory preference still
      // updates above, it just won't persist across reloads.
    }
  }, []);

  return { theme: preference, setTheme };
}
