"use client";

import { useState } from "react";
import type { PerformedExercise, PrescribedSet } from "@bstrainer/domain";
import { getSubstitutes } from "@/lib/data/substitutions";
import type { ExerciseOption } from "@/lib/data/plans";
import type { LastPerformance } from "@/lib/workout/history-lookup";
import type { SetDraft, SetRow } from "@/lib/workout/use-workout-session";
import { publicAssetPath } from "@/lib/public-asset";
import { RPE_OPTIONS, ROW_GRID, formatKg, anteriorLabel, bestE1rm } from "@/lib/workout/exercise-utils";
import { SetRowComponent } from "./SetRow";

export function ExerciseBlockCard({
  exercise,
  displayName,
  mediaSrc,
  last,
  prE1rm,
  supersetGroup,
  restSeconds,
  notes,
  rows,
  onDraftChange,
  onConfirmActive,
  onEditLast,
  onAddRow,
  onRemoveTrailingRow,
  onRemove,
  onOpenPlateCalc,
  onSubstitute,
  onNotesChange,
}: {
  exercise: PerformedExercise;
  displayName: string;
  mediaSrc: string | null;
  last: LastPerformance | null;
  prE1rm?: number;
  supersetGroup?: number | null;
  restSeconds?: number;
  notes?: string | null;
  rows: SetRow[];
  onDraftChange: (index: number, patch: Partial<SetDraft>) => void;
  onConfirmActive: () => void;
  onEditLast: () => void;
  onAddRow: () => void;
  onRemoveTrailingRow: () => void;
  onRemove: () => void;
  onOpenPlateCalc: (kg: number) => void;
  onSubstitute: (option: ExerciseOption) => void;
  onNotesChange?: (notes: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [options, setOptions] = useState<ExerciseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [pseRowIndex, setPseRowIndex] = useState<number | null>(null);

  function openPicker() {
    setPickerOpen(true);
    setOptions([]);
    setLoading(true);
    getSubstitutes(exercise.exerciseId).then((opts) => {
      setOptions(opts);
      setLoading(false);
    });
  }

  function closePicker() {
    setPickerOpen(false);
    setOptions([]);
  }

  const e1rm = bestE1rm(exercise);
  const activeRow = rows.find((r) => r.state === "active");
  const target: PrescribedSet | undefined = activeRow?.target;
  const lastRowIndex = rows.at(-1)?.index ?? -1;

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-surface lg:grid lg:grid-cols-[minmax(240px,340px)_1fr]">
      {mediaSrc && (
        <div className="border-b border-line bg-ink lg:border-b-0 lg:border-r">
          <img
            src={mediaSrc}
            alt=""
            loading="lazy"
            className="h-52 w-full object-contain lg:h-full lg:min-h-[320px]"
          />
        </div>
      )}

      <div className="space-y-3 p-4 lg:p-5">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold">
            {displayName}
          </h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            {supersetGroup != null && (
              <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-semibold text-violet-400">
                Superset
              </span>
            )}
            {e1rm > 0 && (
              <span className="tnum text-xs text-mute">
                e1RM {formatKg(Math.round(e1rm * 10) / 10)} kg
              </span>
            )}
            {last?.loadKg != null && (
              <span className="tnum text-xs text-mute">
                Última: {formatKg(last.loadKg)} kg × {last.reps}
              </span>
            )}
            {target && (
              <span className="tnum rounded-full border border-signal/30 bg-signal/5 px-2 py-0.5 text-xs text-signal">
                Meta: {target.repsMin}
                {target.repsMax !== target.repsMin && `–${target.repsMax}`}
                {target.loadMethod === "rir" && target.targetRir != null && ` · RIR ${target.targetRir}`}
                {target.loadMethod === "rpe" && target.targetRpe != null && ` · RPE ${target.targetRpe}`}
                {target.loadMethod === "percent_1rm" && target.loadValue != null && ` · ${target.loadValue}% 1RM`}
                {" · "}
                desc {target.restSeconds}s
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={openPicker}
            aria-label={`Trocar ${displayName}`}
            className="h-9 w-9 rounded-lg text-mute transition active:bg-surface-2"
          >
            ⇄
          </button>
          {prE1rm != null ? (
            <span className="animate-pr-pop rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-gold">
              PR · {formatKg(Math.round(prE1rm * 10) / 10)} kg
            </span>
          ) : (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remover ${displayName}`}
              className="h-9 w-9 rounded-lg text-mute transition active:bg-surface-2"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {restSeconds != null && restSeconds > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-signal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" strokeLinecap="round" />
          </svg>
          Descanso: {Math.floor(restSeconds / 60)}min {restSeconds % 60 > 0 ? `${restSeconds % 60}s` : ""}
        </div>
      )}

      {/* Notes */}
      {onNotesChange && (
        <div>
          <input
            type="text"
            placeholder="Adicionar notas aqui..."
            value={notes ?? ""}
            onChange={(e) => onNotesChange(e.target.value)}
            className="w-full bg-transparent text-sm text-mute placeholder:text-mute/50 outline-none"
          />
        </div>
      )}

      {/* Trocar exercício */}
      {pickerOpen && (
        <div className="space-y-2 rounded-lg border border-line bg-ink p-3">
          <div className="flex items-center justify-between">
            <p className="caps-label text-mute">Trocar por</p>
            <button
              type="button"
              onClick={closePicker}
              aria-label="Fechar troca"
              className="h-8 w-8 rounded text-mute transition active:bg-surface-2"
            >
              ✕
            </button>
          </div>
          {loading && (
            <p className="px-1 py-2 text-sm text-mute">Buscando…</p>
          )}
          {!loading && options.length === 0 && (
            <p className="px-1 py-2 text-sm text-mute">
              Sem substitutos cadastrados pra este exercício.
            </p>
          )}
          {!loading &&
            options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onSubstitute(opt);
                  closePicker();
                }}
                className="flex min-h-11 w-full items-center gap-3 rounded px-2 py-2 text-left text-sm transition active:bg-surface-2"
              >
                {publicAssetPath(opt.mediaUrl) && (
                  <img
                    src={publicAssetPath(opt.mediaUrl) ?? ""}
                    alt=""
                    loading="lazy"
                    className="h-9 w-9 shrink-0 rounded border border-line bg-ink object-contain"
                  />
                )}
                <span>{opt.name}</span>
              </button>
            ))}
        </div>
      )}

      {/* Tabela de séries */}
      <div className="space-y-1">
        <div className={`grid ${ROW_GRID} gap-1.5 px-1 text-[10px] uppercase tracking-wide text-mute`}>
          <span>Série</span>
          <span>Anterior</span>
          <span>Kg</span>
          <span>Reps</span>
          <span>PSE</span>
          <span />
        </div>

        {rows.map((row) => (
          <SetRowComponent
            key={row.index}
            row={row}
            isLastRow={row.index === lastRowIndex}
            canEditLast={row.index === exercise.sets.length - 1}
            onDraftChange={onDraftChange}
            onConfirmActive={onConfirmActive}
            onEditLast={onEditLast}
            onRemoveTrailingRow={onRemoveTrailingRow}
            onOpenPlateCalc={onOpenPlateCalc}
            onOpenPse={setPseRowIndex}
          />
        ))}

        <button
          type="button"
          onClick={onAddRow}
          className="h-10 w-full rounded-lg border border-dashed border-line text-sm text-mute transition active:bg-surface-2"
        >
          + Adicionar Série
        </button>
      </div>

      {pseRowIndex != null && (
        <div
          className="fixed inset-0 z-30 flex items-end bg-ink/60"
          onClick={() => setPseRowIndex(null)}
        >
          <div
            className="w-full space-y-2 rounded-t-xl border-t border-line bg-surface p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="caps-label text-mute">PSE (esforço percebido)</p>
            <div className="grid grid-cols-3 gap-2">
              {RPE_OPTIONS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => {
                    onDraftChange(pseRowIndex, { rpe: o });
                    setPseRowIndex(null);
                  }}
                  className="h-14 rounded-lg border border-line font-display text-lg font-semibold transition active:bg-surface-2"
                >
                  {o}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                onDraftChange(pseRowIndex, { rpe: "" });
                setPseRowIndex(null);
              }}
              className="h-11 w-full rounded-lg text-sm text-mute transition active:bg-surface-2"
            >
              Limpar
            </button>
          </div>
        </div>
      )}
      </div>
    </section>
  );
}
