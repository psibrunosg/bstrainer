"use client";

import { useEffect, useState } from "react";
import type { PerformedExercise, PrescribedSet } from "@bstrainer/domain";
import type { ProgressionSuggestion } from "@bstrainer/engine";
import { getSubstitutes } from "@/lib/data/substitutions";
import type { ExerciseOption } from "@/lib/data/plans";
import type { LastPerformance } from "@/lib/workout/history-lookup";
import { getExerciseProgressionSuggestion } from "@/lib/workout/history-lookup";
import type { SetDraft, SetRow } from "@/lib/workout/use-workout-session";
import { publicAssetPath } from "@/lib/public-asset";
import { ROW_GRID, formatKg, anteriorLabel, bestE1rm } from "@/lib/workout/exercise-utils";
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
  const [suggestion, setSuggestion] = useState<ProgressionSuggestion | null>(null);
  const [explanationOpen, setExplanationOpen] = useState(false);

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

  useEffect(() => {
    const fallbackLoad = last?.loadKg ?? target?.loadValue ?? 20;
    const fallbackReps = last?.reps ?? target?.repsMin ?? 10;
    const min = target?.repsMin ?? 8;
    const max = target?.repsMax ?? 12;

    getExerciseProgressionSuggestion(
      exercise.exerciseId,
      fallbackLoad,
      fallbackReps,
      min,
      max
    ).then((res) => {
      setSuggestion(res);
    });
  }, [exercise.exerciseId, last, target]);

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

      <div className="space-y-3.5 p-4 lg:p-5">
        <header className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-text">
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
                <span className="tnum rounded-full border border-signal/30 bg-signal/5 px-2 py-0.5 text-xs text-signal font-semibold">
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
              className="h-9 w-9 rounded-lg text-mute transition active:bg-surface-2 hover:text-text"
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
                className="h-9 w-9 rounded-lg text-mute transition active:bg-surface-2 hover:text-err"
              >
                ✕
              </button>
            )}
          </div>
        </header>

        {restSeconds != null && restSeconds > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-signal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" strokeLinecap="round" />
            </svg>
            Descanso: {Math.floor(restSeconds / 60)}min {restSeconds % 60 > 0 ? `${restSeconds % 60}s` : ""}
          </div>
        )}

        {/* Engine Determinística Explicável (Sem Caixas-Pretas IA) */}
        {suggestion && (
          <div className="rounded-lg border border-line bg-surface-2/30 p-3 transition-all duration-200 hover:border-signal/50">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setExplanationOpen((v) => !v)}
                className="flex items-center gap-1.5 text-left text-xs font-semibold text-text hover:text-signal transition"
              >
                <span className="text-sm">⚡</span>
                <span className="text-signal font-display uppercase tracking-wide text-[11px] font-extrabold">Engine:</span>
                <span className="underline decoration-line hover:decoration-signal font-medium">{suggestion.badgeLabel}</span>
                <span className="text-[10px] text-mute ml-0.5">{explanationOpen ? "▲" : "▼"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  rows.forEach((r) => {
                    if (r.state !== "confirmed") {
                      onDraftChange(r.index, {
                        load: String(suggestion.suggestedLoad),
                        reps: Number(suggestion.suggestedReps),
                      });
                    }
                  });
                }}
                className="inline-flex h-8 items-center justify-center rounded bg-signal/15 border border-signal/30 px-3 text-xs font-bold text-signal transition hover:bg-signal hover:text-ink active:scale-95 w-full sm:w-auto shrink-0"
                title="Aplicar pré-preenchimento determinístico nas séries pendentes"
              >
                ✓ Aplicar ({suggestion.suggestedLoad} kg × {suggestion.suggestedReps} reps)
              </button>
            </div>

            {explanationOpen && (
              <div className="mt-3 space-y-2 border-t border-line/70 pt-2.5 text-xs text-mute">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-signal border border-line">
                    Regra: {suggestion.ruleCode}
                  </span>
                  <span className="text-[11px] font-bold text-ok flex items-center gap-1">
                    <span>•</span> 100% Verificável &amp; Explicável (Sem Caixa-Preta de IA)
                  </span>
                </div>
                <p className="leading-relaxed text-[12px] text-text/90 bg-ink/50 p-2.5 rounded border border-line/50">
                  {suggestion.explanation}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {onNotesChange && (
          <div>
            <input
              type="text"
              placeholder="Adicionar notas para este exercício..."
              value={notes ?? ""}
              onChange={(e) => onNotesChange(e.target.value)}
              className="w-full rounded border border-line/50 bg-ink px-3 py-1.5 text-xs text-text placeholder:text-mute/50 outline-none focus:border-signal transition"
            />
          </div>
        )}

        {/* Trocar exercício */}
        {pickerOpen && (
          <div className="space-y-2 rounded-lg border border-line bg-ink p-3 shadow-md">
            <div className="flex items-center justify-between">
              <p className="caps-label font-display font-bold text-text">Trocar Exercício</p>
              <button
                type="button"
                onClick={closePicker}
                aria-label="Fechar troca"
                className="h-8 w-8 rounded text-mute transition active:bg-surface-2 hover:text-text"
              >
                ✕
              </button>
            </div>
            {loading && (
              <p className="px-1 py-2 text-xs text-mute">Buscando opções no banco…</p>
            )}
            {!loading && options.length === 0 && (
              <p className="px-1 py-2 text-xs text-mute">
                Sem substitutos cadastrados para este exercício na biblioteca.
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
                  className="flex min-h-11 w-full items-center gap-3 rounded-md border border-transparent px-2.5 py-2 text-left text-sm transition hover:border-line hover:bg-surface active:bg-surface-2"
                >
                  {publicAssetPath(opt.mediaUrl) && (
                    <img
                      src={publicAssetPath(opt.mediaUrl) ?? ""}
                      alt=""
                      loading="lazy"
                      className="h-9 w-9 shrink-0 rounded border border-line bg-ink object-contain"
                    />
                  )}
                  <span className="font-medium text-text">{opt.name}</span>
                </button>
              ))}
          </div>
        )}

        {/* Tabela de séries */}
        <div className="space-y-1 pt-1">
          <div className={`grid ${ROW_GRID} gap-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-mute`}>
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
            />
          ))}

          <button
            type="button"
            onClick={onAddRow}
            className="mt-2 h-10 w-full rounded-lg border border-dashed border-line text-xs font-semibold text-mute transition hover:border-signal hover:text-signal active:bg-surface-2"
          >
            + Adicionar Nova Série
          </button>
        </div>
      </div>
    </section>
  );
}
