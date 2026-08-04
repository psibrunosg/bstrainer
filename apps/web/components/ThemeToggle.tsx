"use client";

import { useTheme, type ThemePreference } from "@/lib/theme/use-theme";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Sistema" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className="inline-flex items-center rounded-lg border border-line bg-surface p-1"
    >
      {OPTIONS.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(opt.value)}
            className={`h-11 min-w-[4.5rem] rounded-md px-3 text-sm font-semibold transition-colors duration-150 ease-out-quart ${
              active ? "bg-signal text-ink" : "text-mute active:bg-surface-2"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
