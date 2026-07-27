"use client";

import { useState } from "react";
import type { PerformedExercise, PrescribedSet } from "@bstrainer/domain";
import { e1rmEpley } from "@bstrainer/engine";
import { getSubstitutes } from "@/lib/data/substitutions";
import type { ExerciseOption } from "@/lib/data/plans";
import type { LastPerformance } from "@/lib/workout/history-lookup";
import { publicAssetPath } from "@/lib/public-asset";

const RPE_OPTIONS = ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"];

function formatKg(kg: number): string {
  return kg % 1 === 0 ? String(kg) : kg.toFixed(1).replace(".", ",");
}

function bestE1rm(exercise: PerformedExercise): number {
  let best = 0;
  for (const set of exercise.sets) {
    if (set.isWarmup || set.loadKg == null) continue;
    const e = e1rmEpley(set.loadKg, set.reps);
    if (e > best) best = e;
  }
  return best;
}

export function ExerciseBlockCard({
  exercise,
  displayName,
  mediaSrc,
  target,
  last,
  prE1rm,
  draft,
  onDraftChange,
  onConfirmSet,
  onRepeatLastSet,
  onRemoveSet,
  onRemove,
  onOpenPlateCalc,
  onSubstitute,
}: {
  exercise: PerformedExercise;
  displayName: string;
  mediaSrc: string | null;
  target?: PrescribedSet;
  last: LastPerformance | null;
  prE1rm?: number;
  draft: { reps: number; load: string; rpe: string };
  onDraftChange: (patch: Partial<{ reps: number; load: string; rpe: string }>) => void;
  onConfirmSet: () => void;
  onRepeatLastSet: () => void;
  onRemoveSet: (setId: string) => void;
  onRemove: () => void;
  onOpenPlateCalc: (kg: number) => void;
  onSubstitute: (option: ExerciseOption) => void;
}) {
  // ponytail: picker state is now per-card (was page-level before this
  // extraction), so opening the picker on a second card no longer closes
  // the first one — a deliberate, harmless behavior change.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [options, setOptions] = useState<ExerciseOption[]>([]);
  const [loading, setLoading] = useState(false);

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
  const parsedLoad = Number(draft.load.trim().replace(",", "."));

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

      {/* Séries confirmadas */}
      {exercise.sets.length > 0 && (
        <ul className="space-y-px">
          {exercise.sets.map((set) => (
            <li
              key={set.id}
              className="grid h-12 grid-cols-[28px_1fr_1fr_40px] items-center gap-2 border-b border-line text-sm last:border-b-0"
            >
              <span className="caps-label text-mute">{set.order}</span>
              <span className="tnum text-center font-display font-semibold">
                {set.loadKg != null ? `${formatKg(set.loadKg)} kg` : "—"}
              </span>
              <span className="tnum text-center font-display font-semibold">
                {set.reps}
                {set.rpe != null && (
                  <span className="text-mute"> @{set.rpe}</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => onRemoveSet(set.id)}
                aria-label={`Remover série ${set.order}`}
                className="flex h-11 items-center justify-center rounded text-mute transition active:bg-surface-2"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Draft da próxima série */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {/* Stepper de reps */}
          <div className="flex items-center rounded border border-line bg-ink">
            <button
              type="button"
              onClick={() => onDraftChange({ reps: Math.max(0, draft.reps - 1) })}
              aria-label="Menos uma repetição"
              className="h-11 w-10 font-display text-lg font-bold text-mute transition active:bg-surface-2"
            >
              −
            </button>
            <span className="tnum w-10 text-center font-display text-lg font-semibold">
              {draft.reps}
            </span>
            <button
              type="button"
              onClick={() => onDraftChange({ reps: draft.reps + 1 })}
              aria-label="Mais uma repetição"
              className="h-11 w-10 font-display text-lg font-bold text-mute transition active:bg-surface-2"
            >
              +
            </button>
          </div>

          {/* Carga (toque no ícone abre plate calc) */}
          <div className="relative flex-1">
            <input
              type="text"
              inputMode="decimal"
              placeholder={
                last?.loadKg != null ? formatKg(last.loadKg) : "kg"
              }
              value={draft.load}
              onChange={(e) => onDraftChange({ load: e.target.value })}
              className="h-11 w-full rounded border border-line bg-ink px-3 pr-9 text-center font-display text-lg font-semibold outline-none transition-colors placeholder:font-body placeholder:text-base placeholder:font-normal placeholder:text-mute focus:border-signal"
            />
            {Number.isFinite(parsedLoad) && parsedLoad > 20 && (
              <button
                type="button"
                onClick={() => onOpenPlateCalc(parsedLoad)}
                aria-label="Calcular anilhas"
                className="absolute right-1 top-1/2 flex h-9 w-8 -translate-y-1/2 items-center justify-center rounded text-mute transition active:bg-surface-2"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden
                >
                  <path d="M3 12h2" strokeLinecap="round" />
                  <path d="M19 12h2" strokeLinecap="round" />
                  <rect x="6" y="8" width="3" height="8" rx="0.5" />
                  <rect x="15" y="8" width="3" height="8" rx="0.5" />
                  <path d="M9 12h6" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          {/* RPE */}
          <select
            aria-label="RPE da série"
            value={draft.rpe}
            onChange={(e) => onDraftChange({ rpe: e.target.value })}
            className="h-11 rounded border border-line bg-ink px-2 text-sm outline-none focus:border-signal"
          >
            <option value="">RPE</option>
            {RPE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onConfirmSet}
            className="h-12 flex-1 rounded-lg bg-signal text-sm font-semibold text-ink transition active:scale-[0.98] active:bg-signal-press"
          >
            Confirmar série
          </button>
          {exercise.sets.length > 0 && (
            <button
              type="button"
              onClick={onRepeatLastSet}
              className="h-12 rounded-lg border border-line px-4 text-sm font-semibold text-text transition active:bg-surface-2"
            >
              Repetir
            </button>
          )}
        </div>
      </div>
      </div>
    </section>
  );
}
