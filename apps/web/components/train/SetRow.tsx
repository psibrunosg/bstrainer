"use client";

import { useState } from "react";
import type { SetDraft, SetRow as SetRowData } from "@/lib/workout/set-rows";
import { anteriorLabel, formatKg, ROW_GRID, RPE_OPTIONS } from "@/lib/workout/exercise-utils";

function PseInlinePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="h-10 w-full rounded border border-line bg-surface text-xs font-semibold text-mute transition duration-150 ease-out-quart active:bg-surface-2"
      >
        {value || "PSE"}
      </button>
      {open && (
        <div
          className="absolute bottom-full left-1/2 z-10 mb-1.5 w-max -translate-x-1/2 rounded-lg border border-line bg-surface p-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.15)]"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="grid grid-cols-5 gap-1">
            {RPE_OPTIONS.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                }}
                className={`h-8 w-8 rounded text-xs font-semibold transition duration-150 ease-out-quart active:scale-[0.95] ${
                  value === o ? "bg-signal text-ink" : "text-mute active:bg-surface-2"
                }`}
              >
                {o}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="col-span-5 mt-1 h-7 rounded text-[11px] text-mute active:bg-surface-2"
            >
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SetRowComponent({
  row,
  isLastRow,
  canEditLast,
  onDraftChange,
  onConfirmActive,
  onEditLast,
  onRemoveTrailingRow,
  onOpenPlateCalc,
}: {
  row: SetRowData;
  isLastRow: boolean;
  canEditLast: boolean;
  onDraftChange?: (index: number, patch: Partial<SetDraft>) => void;
  onConfirmActive?: () => void;
  onEditLast?: () => void;
  onRemoveTrailingRow?: () => void;
  onOpenPlateCalc?: (kg: number) => void;
}) {
  if (row.state === "confirmed") {
    return (
      <div
        key={row.index}
        className={`grid h-11 ${ROW_GRID} items-center gap-1.5 rounded border border-line/60 bg-ink/40 px-1 text-sm`}
      >
        <span className="caps-label text-mute">{row.index + 1}</span>
        <span className="tnum text-xs text-mute">{anteriorLabel(row.anterior)}</span>
        <span className="tnum text-center font-display font-semibold text-mute">
          {row.confirmedSet?.loadKg != null ? formatKg(row.confirmedSet.loadKg) : "—"}
        </span>
        <span className="tnum text-center font-display font-semibold text-mute">
          {row.confirmedSet?.reps}
        </span>
        <span className="tnum text-center text-xs text-mute">
          {row.confirmedSet?.rpe ?? "—"}
        </span>
        {canEditLast ? (
          <button
            type="button"
            onClick={onEditLast}
            aria-label={`Editar série ${row.index + 1}`}
            className="flex h-9 w-9 items-center justify-center justify-self-end rounded-full bg-signal text-sm font-bold text-ink transition active:scale-95"
          >
            ✓
          </button>
        ) : (
          <span className="flex h-9 w-9 items-center justify-center justify-self-end rounded-full bg-signal/40 text-sm font-bold text-ink">
            ✓
          </span>
        )}
      </div>
    );
  }

  if (row.state === "preview") {
    return (
      <div
        key={row.index}
        className={`grid h-11 ${ROW_GRID} items-center gap-1.5 px-1 text-sm text-mute/60`}
      >
        <span className="caps-label">{row.index + 1}</span>
        <span className="tnum text-xs">{anteriorLabel(row.anterior)}</span>
        <span className="tnum text-center">
          {row.target?.loadMethod === "absolute" && row.target.loadValue != null
            ? formatKg(row.target.loadValue)
            : "—"}
        </span>
        <span className="tnum text-center">{row.target?.repsMin ?? "—"}</span>
        <span className="tnum text-center">{row.target?.targetRpe ?? "—"}</span>
        {isLastRow ? (
          <button
            type="button"
            onClick={onRemoveTrailingRow}
            aria-label={`Remover linha ${row.index + 1}`}
            className="flex h-9 w-9 items-center justify-center justify-self-end rounded text-mute transition active:bg-surface-2"
          >
            ✕
          </button>
        ) : (
          <span />
        )}
      </div>
    );
  }

  // active
  const draft = row.draft ?? { reps: 0, load: "", rpe: "" };
  const parsedLoad = Number(draft.load.trim().replace(",", "."));
  return (
    <div
      key={row.index}
      className={`grid ${ROW_GRID} items-center gap-1.5 rounded border border-signal/40 bg-ink px-1 py-1`}
    >
      <span className="caps-label text-signal">{row.index + 1}</span>
      <span className="tnum text-xs text-mute">{anteriorLabel(row.anterior)}</span>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          placeholder={row.anterior?.loadKg != null ? formatKg(row.anterior.loadKg) : "kg"}
          value={draft.load}
          onChange={(e) => onDraftChange?.(row.index, { load: e.target.value })}
          className="h-10 w-full rounded border border-line bg-surface px-1 pr-6 text-center font-display text-sm font-semibold outline-none transition-colors placeholder:font-body placeholder:text-xs placeholder:font-normal placeholder:text-mute focus:border-signal"
        />
        {Number.isFinite(parsedLoad) && parsedLoad > 20 && (
          <button
            type="button"
            onClick={() => onOpenPlateCalc?.(parsedLoad)}
            aria-label="Calcular anilhas"
            className="absolute right-0 top-1/2 flex h-8 w-6 -translate-y-1/2 items-center justify-center text-mute"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M3 12h2" strokeLinecap="round" />
              <path d="M19 12h2" strokeLinecap="round" />
              <rect x="6" y="8" width="3" height="8" rx="0.5" />
              <rect x="15" y="8" width="3" height="8" rx="0.5" />
              <path d="M9 12h6" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
      <input
        type="text"
        inputMode="numeric"
        placeholder="reps"
        value={draft.reps === 0 ? "" : String(draft.reps)}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "");
          onDraftChange?.(row.index, { reps: digits === "" ? 0 : Number(digits) });
        }}
        className="h-10 w-full rounded border border-line bg-surface px-1 text-center font-display text-sm font-semibold outline-none transition-colors placeholder:font-body placeholder:text-xs placeholder:font-normal placeholder:text-mute focus:border-signal"
      />
      <PseInlinePicker
        value={draft.rpe}
        onChange={(v) => onDraftChange?.(row.index, { rpe: v })}
      />
      <button
        type="button"
        onClick={onConfirmActive}
        disabled={draft.reps <= 0}
        aria-label={`Confirmar série ${row.index + 1}`}
        className="flex h-9 w-9 items-center justify-center justify-self-end rounded-full border border-signal text-sm font-bold text-signal transition active:scale-95 active:bg-signal/10 disabled:opacity-30"
      >
        ✓
      </button>
    </div>
  );
}
