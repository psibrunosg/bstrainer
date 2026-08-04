// apps/web/components/ui/Button.tsx
"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "sm" | "icon";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-signal text-ink active:bg-signal-press disabled:opacity-40",
  secondary:
    "border border-line bg-surface text-text active:bg-surface-2 disabled:opacity-40",
  ghost:
    "text-mute active:bg-surface-2 active:text-text disabled:opacity-40",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: "h-12 rounded-lg px-4 text-[15px] font-semibold",
  sm: "h-11 rounded-lg px-3 text-sm font-semibold",
  icon: "h-9 w-9 rounded-lg",
};

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  type = "button",
  ...rest
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 transition duration-150 ease-out-quart active:scale-[0.98] ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
