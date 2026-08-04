"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isPerformedExercise,
  type PerformedActivity,
  type PerformedCircuit,
} from "@bstrainer/domain";
import { exerciseName, loadCatalogExercises, type ExerciseOption as CatalogExerciseOption } from "@/lib/workout/exercises";
import { publicAssetPath } from "@/lib/public-asset";
import { RequireAthlete } from "@/components/RequireAthlete";
import { PlateCalculator } from "@/components/PlateCalculator";
import { REST_DEFAULT_SEC, useRestTimer } from "@/lib/workout/use-rest-timer";
import { useWorkoutSession } from "@/lib/workout/use-workout-session";
import { ExerciseBlockCard } from "@/components/train/ExerciseBlockCard";
import { ActivityBlockCard, CircuitBlockCard } from "@/components/train/BlockCards";
import { SessionSummary } from "@/components/train/SessionSummary";
import { formatKg } from "@/lib/workout/exercise-utils";

const SRPE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const MUSCLE_LABEL: Record<string, string> = {
  chest: "Peito",
  back: "Costas",
  shoulders: "Ombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  forearms: "Antebraços",
  quads: "Quadríceps",
  hamstrings: "Isquiotibiais",
  glutes: "Glúteos",
  calves: "Panturrilhas",
  core: "Core",
  full_body: "Corpo todo",
};

const LOAD_LABEL: Record<string, string> = {
  barbell: "Barra",
  dumbbell: "Haltere",
  machine: "Máquina",
  cable: "Polia",
  bodyweight: "Peso corporal",
  band: "Elástico",
  kettlebell: "Kettlebell",
  time: "Tempo",
};

function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function TrainSessionPage() {
  return (
    <RequireAthlete>
      <TrainSessionContent />
    </RequireAthlete>
  );
}

function TrainSessionContent() {
  const router = useRouter();
  const rest = useRestTimer();
  const s = useWorkoutSession();
  const [exercises, setExercises] = useState<CatalogExerciseOption[]>([]);
  const [search, setSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [askingSrpe, setAskingSrpe] = useState(false);
  const [plateTarget, setPlateTarget] = useState<number | null>(null);
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [loadFilter, setLoadFilter] = useState<string | null>(null);

  useEffect(() => {
    loadCatalogExercises().then(setExercises);
  }, []);

  // ponytail: the one coupling confirmActiveRow used to own (start rest after
  // a set is logged) — hook doesn't own timers, so the page wires it back.
  const confirmActiveRow = (rowId: string, exerciseId: string) => {
    s.confirmActiveRow(rowId, exerciseId);
    rest.start();
  };

  if (!s.loaded) {
    return (
      <div className="mx-auto max-w-6xl p-4 lg:p-6">
        <div className="h-14 animate-pulse rounded-lg bg-surface-2" />
      </div>
    );
  }

  if (s.finished) {
    return (
      <SessionSummary
        session={s.finished}
        prCount={Object.keys(s.prHit).length}
        onBack={() => router.push("/train")}
        nameOverrides={s.substituteOverride}
      />
    );
  }

  if (!s.session) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-4 lg:p-6">
        <h1 className="font-display text-[28px] font-extrabold uppercase tracking-tight">
          Sessão
        </h1>
        <p className="text-sm text-mute">Nenhum treino em andamento.</p>
        <button
          type="button"
          onClick={() => router.push("/train")}
          className="h-12 w-full rounded-lg bg-signal text-[15px] font-semibold text-ink transition active:scale-[0.98] active:bg-signal-press"
        >
          Ir para Treinar
        </button>
      </div>
    );
  }

  // ---- Sessão ativa ----

  const filtered = exercises.filter((e) => {
    const matchesSearch = e.name.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"));
    const matchesMuscle = !muscleFilter || (e.primaryMuscles ?? []).includes(muscleFilter);
    const matchesLoad = !loadFilter || e.loadType === loadFilter;
    return matchesSearch && matchesMuscle && matchesLoad;
  });
  const availableMuscles = [...new Set(exercises.flatMap((e) => e.primaryMuscles ?? []))].sort();
  const availableLoadTypes = [...new Set(exercises.map((e) => e.loadType).filter((v): v is string => Boolean(v)))].sort();
  const restCritical = rest.isActive && rest.secondsLeft <= 10;

  return (
    <div className="mx-auto max-w-6xl pb-6">
      {/* Timer de descanso fixo no topo */}
      <div
        className={`sticky top-0 z-20 border-b border-line px-4 py-3 backdrop-blur-sm transition-colors lg:px-6 ${
          rest.justFinished ? "animate-timer-pulse" : rest.isActive ? "bg-surface-2" : "bg-ink/95"
        }`}
      >
        {rest.isActive ? (
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => rest.adjust(-15)}
              className="h-11 rounded-lg border border-line px-3 text-sm font-semibold text-mute transition active:bg-surface-2"
            >
              −15s
            </button>
            <p
              className={`tnum font-display text-4xl font-bold ${
                restCritical ? "text-signal" : "text-text"
              }`}
            >
              {formatClock(rest.secondsLeft)}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => rest.adjust(15)}
                className="h-11 rounded-lg border border-line px-3 text-sm font-semibold text-mute transition active:bg-surface-2"
              >
                +15s
              </button>
              <button
                type="button"
                onClick={() => rest.skip()}
                className="h-11 rounded-lg px-3 text-sm text-mute transition active:bg-surface-2"
              >
                Pular
              </button>
            </div>
          </div>
        ) : (
          <div className="flex h-11 items-center justify-between">
            <p className="caps-label font-display font-semibold text-mute">
              {rest.justFinished ? "Descanso concluído" : "Treino livre"}
            </p>
            {!rest.justFinished && (
              <button
                type="button"
                onClick={() => rest.start()}
                className="h-11 rounded-lg border border-line px-4 text-sm font-semibold text-text transition active:bg-surface-2"
              >
                Descanso {REST_DEFAULT_SEC}s
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 p-4 lg:p-6">
        {/* Workout stats bar */}
        {(() => {
          const durationSec = Math.floor((Date.now() - Date.parse(s.session.startedAt)) / 1000);
          const durationMin = Math.max(1, Math.round(durationSec / 60));
          const finishedEx = s.session.blocks.filter(isPerformedExercise);
          const totalSets = finishedEx.reduce((acc, e) => acc + e.sets.length, 0);
          const totalKg = finishedEx.reduce((acc, e) => {
            const exKg = e.sets.reduce((sa, set) => {
              if (set.loadKg == null) return sa;
              return sa + set.loadKg * set.reps;
            }, 0);
            return acc + exKg;
          }, 0);
          return (
            <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-2 text-xs text-mute">
              <span>Duração<span className="tnum ml-1 font-display font-semibold text-text">{durationMin}min</span></span>
              <span>Volume<span className="tnum ml-1 font-display font-semibold text-text">{formatKg(totalKg)} kg</span></span>
              <span>Séries<span className="tnum ml-1 font-display font-semibold text-text">{totalSets}</span></span>
            </div>
          );
        })()}
        {s.session.blocks.filter(isPerformedExercise).map((ex) => {
          const prescribed = ex.prescribedExerciseId ? s.prescribedById[ex.prescribedExerciseId] : undefined;
          const pBlock = prescribed?.kind === "exercise" ? prescribed : undefined;
          return (
            <ExerciseBlockCard
              key={ex.id}
              exercise={ex}
              displayName={s.substituteOverride[ex.exerciseId]?.name ?? exerciseName(ex.exerciseId)}
              mediaSrc={publicAssetPath(
                s.substituteOverride[ex.exerciseId]?.mediaUrl ?? exercises.find((e) => e.id === ex.exerciseId)?.mediaUrl,
              )}
              last={s.lastPerf[ex.exerciseId] ?? null}
              prE1rm={s.prHit[ex.exerciseId]}
              supersetGroup={pBlock?.supersetGroup}
              restSeconds={pBlock?.sets[0]?.restSeconds}
              notes={pBlock?.notes}
              rows={s.rowsFor(ex.id, ex.exerciseId)}
              onDraftChange={(index, patch) => s.setDraftAt(ex.id, ex.exerciseId, index, patch)}
              onConfirmActive={() => confirmActiveRow(ex.id, ex.exerciseId)}
              onEditLast={() => s.editLastConfirmedRow(ex.id)}
              onAddRow={() => s.addRow(ex.id)}
              onRemoveTrailingRow={() => s.removeTrailingRow(ex.id)}
              onRemove={() => s.removeExercise(ex.id)}
              onOpenPlateCalc={setPlateTarget}
              onSubstitute={(opt) => s.applySubstitute(ex.id, opt)}
            />
          );
        })}

        {/* Blocks de atividade contínua (corrida, bike) */}
        {s.session.blocks
          .filter((b): b is PerformedActivity & { kind: "activity" } => b.kind === "activity")
          .map((a) => (
            <ActivityBlockCard
              key={a.id}
              activity={a}
              prescribed={a.prescribedActivityId ? s.prescribedById[a.prescribedActivityId] : undefined}
              name={s.activityInfo[a.activityId]?.name}
              onChange={(patch) => s.updateActivity(a.id, patch)}
            />
          ))}

        {/* Blocks de circuito (HIIT) */}
        {s.session.blocks
          .filter((b): b is PerformedCircuit & { kind: "circuit" } => b.kind === "circuit")
          .map((c) => (
            <CircuitBlockCard
              key={c.id}
              circuit={c}
              prescribed={c.prescribedCircuitId ? s.prescribedById[c.prescribedCircuitId] : undefined}
              onChange={(patch) => s.updateCircuit(c.id, patch)}
            />
          ))}

        {/* Adicionar exercício */}
        {showPicker ? (
          <section className="space-y-2 rounded-lg border border-line bg-surface p-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Buscar exercício…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded border border-line bg-ink px-3 text-base outline-none placeholder:text-mute focus:border-signal"
              />
              <button
                type="button"
                onClick={() => {
                  setShowPicker(false);
                  setSearch("");
                  setMuscleFilter(null);
                  setLoadFilter(null);
                }}
                aria-label="Fechar busca"
                className="h-11 w-11 rounded-lg text-mute transition active:bg-surface-2"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {availableMuscles.length > 0 && (
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-mute">Músculos</p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableMuscles.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMuscleFilter(muscleFilter === m ? null : m)}
                        className={`h-8 rounded-full px-3 text-xs font-medium transition active:scale-95 ${
                          muscleFilter === m
                            ? "bg-signal text-ink"
                            : "border border-line bg-surface text-mute hover:border-signal/40"
                        }`}
                      >
                        {MUSCLE_LABEL[m] ?? m}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {availableLoadTypes.length > 0 && (
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-mute">Equipamento</p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableLoadTypes.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLoadFilter(loadFilter === l ? null : l)}
                        className={`h-8 rounded-full px-3 text-xs font-medium transition active:scale-95 ${
                          loadFilter === l
                            ? "bg-signal text-ink"
                            : "border border-line bg-surface text-mute hover:border-signal/40"
                        }`}
                      >
                        {LOAD_LABEL[l] ?? l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <ul className="max-h-64 space-y-px overflow-y-auto lg:grid lg:max-h-[28rem] lg:grid-cols-2 lg:gap-1 lg:space-y-0">
              {filtered.map((e) => (
                <li key={e.id}>
                  {(() => {
                    const mediaSrc = publicAssetPath(e.mediaUrl);
                    return (
                  <button
                    type="button"
                    onClick={() => {
                      s.addExercise(e.id);
                      setShowPicker(false);
                      setSearch("");
                      setMuscleFilter(null);
                      setLoadFilter(null);
                    }}
                    className="flex min-h-14 w-full items-center gap-3 rounded px-2 py-2 text-left text-sm transition active:bg-surface-2"
                  >
                    {mediaSrc && (
                      <img
                        src={mediaSrc}
                        alt=""
                        loading="lazy"
                        className="h-11 w-11 shrink-0 rounded border border-line bg-ink object-contain"
                      />
                    )}
                    <span>{e.name}</span>
                  </button>
                    );
                  })()}
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-mute">
                  Nenhum exercício encontrado.
                </li>
              )}
            </ul>
          </section>
        ) : (
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="h-12 w-full rounded-lg border border-dashed border-line text-sm font-semibold text-mute transition active:bg-surface"
          >
            + Adicionar exercício
          </button>
        )}

        {/* Finalizar */}
        {s.session.blocks.length > 0 && (
          <button
            type="button"
            onClick={() => setAskingSrpe(true)}
            className="h-12 w-full rounded-lg border border-line bg-surface text-[15px] font-semibold text-text transition active:bg-surface-2"
          >
            Finalizar treino
          </button>
        )}
      </div>

      {/* Overlay de sRPE */}
      {askingSrpe && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl space-y-4 rounded-lg border border-line bg-surface p-5 shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
            <div>
              <h2 className="font-display text-xl font-semibold">
                Esforço da sessão
              </h2>
              <p className="mt-1 text-sm text-mute">
                De 0 (repouso) a 10 (máximo), quão pesado foi o treino inteiro?
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {SRPE_OPTIONS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    s.finishSession(v);
                    setAskingSrpe(false);
                  }}
                  className="tnum h-12 rounded border border-line bg-ink font-display text-base font-semibold transition active:border-signal active:bg-signal/10"
                >
                  {v}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setAskingSrpe(false)}
              className="h-11 w-full rounded-lg text-sm text-mute transition active:bg-surface-2"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Plate calculator */}
      {plateTarget != null && (
        <PlateCalculator
          targetKg={plateTarget}
          onClose={() => setPlateTarget(null)}
        />
      )}
    </div>
  );
}
