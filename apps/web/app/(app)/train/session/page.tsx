"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isPerformedExercise,
  type PerformedActivity,
  type PerformedCircuit,
  type PerformedExercise,
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

const SRPE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

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

  useEffect(() => {
    loadCatalogExercises().then(setExercises);
  }, []);

  // ponytail: the one coupling appendSet used to own (start rest after a set
  // is logged) — hook dropped it, so the page wires it back for both append paths.
  const confirmSet = (rowId: string, exerciseId: string) => {
    s.confirmSet(rowId, exerciseId);
    rest.start();
  };
  const repeatLastSet = (ex: PerformedExercise) => {
    s.repeatLastSet(ex);
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

  const filtered = exercises.filter((e) =>
    e.name.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")),
  );
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
        {s.session.blocks.filter(isPerformedExercise).map((ex) => (
          <ExerciseBlockCard
            key={ex.id}
            exercise={ex}
            displayName={s.substituteOverride[ex.exerciseId]?.name ?? exerciseName(ex.exerciseId)}
            mediaSrc={publicAssetPath(
              s.substituteOverride[ex.exerciseId]?.mediaUrl ?? exercises.find((e) => e.id === ex.exerciseId)?.mediaUrl,
            )}
            target={s.targetSetFor(ex.id)}
            last={s.lastPerf[ex.exerciseId] ?? null}
            prE1rm={s.prHit[ex.exerciseId]}
            draft={s.draftFor(ex.id, ex.exerciseId)}
            onDraftChange={(patch) => s.setDraft(ex.id, ex.exerciseId, patch)}
            onConfirmSet={() => confirmSet(ex.id, ex.exerciseId)}
            onRepeatLastSet={() => repeatLastSet(ex)}
            onRemoveSet={(setId) => s.removeSet(ex.id, setId)}
            onRemove={() => s.removeExercise(ex.id)}
            onOpenPlateCalc={setPlateTarget}
            onSubstitute={(opt) => s.applySubstitute(ex.id, opt)}
          />
        ))}

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
                }}
                aria-label="Fechar busca"
                className="h-11 w-11 rounded-lg text-mute transition active:bg-surface-2"
              >
                ✕
              </button>
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
