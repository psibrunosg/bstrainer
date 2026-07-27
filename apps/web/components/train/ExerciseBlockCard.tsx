"use client";

import { useState } from "react";
import type { PerformedExercise, PrescribedSet } from "@bstrainer/domain";
import { e1rmEpley } from "@bstrainer/engine";
import { getSubstitutes } from "@/lib/data/substitutions";
import type { ExerciseOption } from "@/lib/data/plans";
import type { LastPerformance } from "@/lib/workout/history-lookup";
import type { SetDraft, SetRow } from "@/lib/workout/use-workout-session";
import { publicAssetPath } from "@/lib/public-asset";

const RPE_OPTIONS = ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"];
const ROW_GRID = "grid-cols-[24px_58px_1fr_1fr_52px_40px]";

function formatKg(kg: number): string {
  return kg % 1 === 0 ? String(kg) : kg.toFixed(1).replace(".", ",");
}

function anteriorLabel(a?: LastPerformance): string {
  if (!a) return "—";
  return a.loadKg != null ? `${formatKg(a.loadKg)}kg×${a.reps}` : `${a.reps} reps`;
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
  last,
  prE1rm,
  rows,
  onDraftChange,
  onConfirmActive,
  onEditLast,
  onAddRow,
  onRemoveTrailingRow,
  onRemove,
  onOpenPlateCalc,
  onSubstitute,
}: {
  exercise: PerformedExercise;
  displayName: string;
  mediaSrc: string | null;
  last: LastPerformance | null;
  prE1rm?: number;
  rows: SetRow[];
  onDraftChange: (index: number, patch: Partial<SetDraft>) => void;
  onConfirmActive: () => void;
  onEditLast: () => void;
  onAddRow: () => void;
  onRemoveTrailingRow: () => void;
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
  const lastRowIndex = rows.at(-1)?.index ?? -1; // ponytail: noUncheckedIndexedAccess needs the optional chain here

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

        {rows.map((row) => {
          if (row.state === "confirmed") {
            const canEdit = row.index === exercise.sets.length - 1;
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
                {canEdit ? (
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
            const canRemove = row.index === lastRowIndex;
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
                {canRemove ? (
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
                  onChange={(e) => onDraftChange(row.index, { load: e.target.value })}
                  className="h-10 w-full rounded border border-line bg-surface px-1 pr-6 text-center font-display text-sm font-semibold outline-none transition-colors placeholder:font-body placeholder:text-xs placeholder:font-normal placeholder:text-mute focus:border-signal"
                />
                {Number.isFinite(parsedLoad) && parsedLoad > 20 && (
                  <button
                    type="button"
                    onClick={() => onOpenPlateCalc(parsedLoad)}
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
                  onDraftChange(row.index, { reps: digits === "" ? 0 : Number(digits) });
                }}
                className="h-10 w-full rounded border border-line bg-surface px-1 text-center font-display text-sm font-semibold outline-none transition-colors placeholder:font-body placeholder:text-xs placeholder:font-normal placeholder:text-mute focus:border-signal"
              />
              <button
                type="button"
                onClick={() => setPseRowIndex(row.index)}
                className="h-10 rounded border border-line bg-surface text-xs font-semibold text-mute transition active:bg-surface-2"
              >
                {draft.rpe || "PSE"}
              </button>
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
        })}

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
