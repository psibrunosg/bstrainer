import Link from "next/link";
import React, { type ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-line bg-surface p-8 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-mute">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="font-display text-base font-semibold text-text">{title}</p>
        {description && <p className="text-sm text-mute">{description}</p>}
      </div>
      {action &&
        (action.href ? (
          <Link
            href={action.href}
            className="mt-1 inline-flex h-11 items-center justify-center rounded-lg bg-signal px-5 text-sm font-semibold text-ink transition duration-150 ease-out-quart active:scale-[0.98] active:bg-signal-press"
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-1 inline-flex h-11 items-center justify-center rounded-lg bg-signal px-5 text-sm font-semibold text-ink transition duration-150 ease-out-quart active:scale-[0.98] active:bg-signal-press"
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}
