"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  PerformedExercise,
  PerformedSet,
  WorkoutSession,
} from "@bstrainer/domain";
import { e1rmEpley, sessionTonnage } from "@bstrainer/engine";
import { EXERCISES, exerciseName } from "@/lib/workout/exercises";
import {
  appendToSessionHistory,
  clearActiveSession,
  loadActiveSession,
  saveActiveSession,
} from "@/lib/workout/storage";

const REST_DEFAULT_SEC = 90;
const RPE_OPTIONS = ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"];
const SRPE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface SetDraft {
  reps: number;
  load: string;
  rpe: string;
}

const EMPTY_DRAFT: SetDraft = { reps: 8, load: "", rpe: "" };

function parseLoad(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function formatKg(kg: number): string {
  return kg % 1 === 0 ? String(kg) : kg.toFixed(1).replace(".", ",");
}

function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
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

export default function TrainSessionPage() {
  const router = useRouter();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, SetDraft>>({});

  // Timer de descanso
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [restLeft, setRestLeft] = useState(0);
  const [restDone, setRestDone] = useState(false);

  // Finalização
  const [askingSrpe, setAskingSrpe] = useState(false);
  const [finished, setFinished] = useState<WorkoutSession | null>(null);

  useEffect(() => {
    const active = loadActiveSession();
    setSession(active);
    setLoaded(true);
  }, []);

  // Persiste toda mudança na sessão ativa
  useEffect(() => {
    if (session && session.status === "in_progress") {
      saveActiveSession(session);
    }
  }, [session]);

  // Contagem regressiva do descanso
  useEffect(() => {
    if (restEndsAt == null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000));
      setRestLeft(left);
      if (left <= 0) {
        setRestEndsAt(null);
        setRestDone(true);
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.([200, 100, 200, 100, 400]);
        }
      }
    };
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [restEndsAt]);

  // Apaga o alerta visual do descanso após alguns segundos
  useEffect(() => {
    if (!restDone) return;
    const t = setTimeout(() => setRestDone(false), 4000);
    return () => clearTimeout(t);
  }, [restDone]);

  const startRest = useCallback(() => {
    setRestDone(false);
    setRestEndsAt(Date.now() + REST_DEFAULT_SEC * 1000);
  }, []);

  function adjustRest(deltaSec: number) {
    setRestEndsAt((prev) => {
      if (prev == null) return prev;
      return Math.max(Date.now() + 1000, prev + deltaSec * 1000);
    });
  }

  function draftFor(exerciseRowId: string): SetDraft {
    return drafts[exerciseRowId] ?? EMPTY_DRAFT;
  }

  function setDraft(exerciseRowId: string, patch: Partial<SetDraft>) {
    setDrafts((prev) => ({
      ...prev,
      [exerciseRowId]: { ...draftFor(exerciseRowId), ...patch },
    }));
  }

  function addExercise(exerciseId: string) {
    setSession((prev) => {
      if (!prev) return prev;
      const row: PerformedExercise = {
        id: crypto.randomUUID(),
        exerciseId,
        prescribedExerciseId: null,
        order: prev.exercises.length + 1,
        wasSubstituted: false,
        sets: [],
      };
      return { ...prev, exercises: [...prev.exercises, row] };
    });
    setSearch("");
    setShowPicker(false);
  }

  function removeExercise(rowId: string) {
    setSession((prev) => {
      if (!prev) return prev;
      const exercises = prev.exercises
        .filter((e) => e.id !== rowId)
        .map((e, i) => ({ ...e, order: i + 1 }));
      return { ...prev, exercises };
    });
  }

  function appendSet(rowId: string, set: Omit<PerformedSet, "id" | "order">) {
    setSession((prev) => {
      if (!prev) return prev;
      const exercises = prev.exercises.map((e) => {
        if (e.id !== rowId) return e;
        const newSet: PerformedSet = {
          ...set,
          id: crypto.randomUUID(),
          order: e.sets.length + 1,
        };
        return { ...e, sets: [...e.sets, newSet] };
      });
      return { ...prev, exercises };
    });
    startRest();
  }

  function confirmSet(rowId: string) {
    const d = draftFor(rowId);
    appendSet(rowId, {
      reps: d.reps,
      loadKg: parseLoad(d.load),
      rpe: d.rpe === "" ? null : Number(d.rpe),
      rir: null,
      isFailure: false,
      isWarmup: false,
      timeSeconds: null,
      notes: null,
    });
  }

  function repeatLastSet(exercise: PerformedExercise) {
    const last = exercise.sets[exercise.sets.length - 1];
    if (!last) return;
    appendSet(exercise.id, {
      reps: last.reps,
      loadKg: last.loadKg,
      rpe: last.rpe,
      rir: last.rir,
      isFailure: false,
      isWarmup: last.isWarmup,
      timeSeconds: last.timeSeconds,
      notes: null,
    });
  }

  function removeSet(rowId: string, setId: string) {
    setSession((prev) => {
      if (!prev) return prev;
      const exercises = prev.exercises.map((e) => {
        if (e.id !== rowId) return e;
        const sets = e.sets
          .filter((s) => s.id !== setId)
          .map((s, i) => ({ ...s, order: i + 1 }));
        return { ...e, sets };
      });
      return { ...prev, exercises };
    });
  }

  function finishSession(srpe: number) {
    if (!session) return;
    const done: WorkoutSession = {
      ...session,
      finishedAt: new Date().toISOString(),
      status: "completed",
      sessionRpe: srpe,
    };
    appendToSessionHistory(done);
    clearActiveSession();
    setAskingSrpe(false);
    setFinished(done);
    setSession(done);
  }

  // ---- Renders de estado especial ----

  if (!loaded) {
    return (
      <div className="mx-auto max-w-lg p-4">
        <p className="text-sm text-zinc-500">Carregando…</p>
      </div>
    );
  }

  if (finished) {
    const durationMin = Math.max(
      1,
      Math.round(
        (Date.parse(finished.finishedAt ?? finished.startedAt) -
          Date.parse(finished.startedAt)) /
          60_000,
      ),
    );
    const totalSets = finished.exercises.reduce(
      (acc, e) => acc + e.sets.length,
      0,
    );
    return (
      <div className="mx-auto max-w-lg space-y-6 p-4">
        <h1 className="text-2xl font-bold">Treino concluído</h1>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-zinc-900 p-4 text-center">
            <p className="text-2xl font-bold">{durationMin}</p>
            <p className="text-xs text-zinc-400">min</p>
          </div>
          <div className="rounded-lg bg-zinc-900 p-4 text-center">
            <p className="text-2xl font-bold">
              {formatKg(sessionTonnage(finished))}
            </p>
            <p className="text-xs text-zinc-400">kg tonelagem</p>
          </div>
          <div className="rounded-lg bg-zinc-900 p-4 text-center">
            <p className="text-2xl font-bold">{totalSets}</p>
            <p className="text-xs text-zinc-400">séries</p>
          </div>
        </div>
        <ul className="space-y-2">
          {finished.exercises.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between rounded-lg bg-zinc-900 px-4 py-3 text-sm"
            >
              <span>{exerciseName(e.exerciseId)}</span>
              <span className="text-zinc-400">{e.sets.length} séries</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => router.push("/train")}
          className="min-h-12 w-full rounded-lg bg-emerald-600 px-4 py-3 text-base font-semibold text-white transition active:bg-emerald-500"
        >
          Voltar para Treinar
        </button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-4">
        <h1 className="text-2xl font-bold">Sessão</h1>
        <p className="text-sm text-zinc-400">Nenhum treino em andamento.</p>
        <button
          type="button"
          onClick={() => router.push("/train")}
          className="min-h-12 w-full rounded-lg bg-emerald-600 px-4 py-3 text-base font-semibold text-white transition active:bg-emerald-500"
        >
          Ir para Treinar
        </button>
      </div>
    );
  }

  // ---- Sessão ativa ----

  const filtered = EXERCISES.filter((e) =>
    e.name.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")),
  );
  const restActive = restEndsAt != null;

  return (
    <div className="mx-auto max-w-lg pb-4">
      {/* Timer de descanso fixo no topo */}
      <div
        className={`sticky top-0 z-20 border-b border-zinc-800 px-4 py-3 backdrop-blur transition-colors ${
          restDone
            ? "animate-pulse bg-emerald-600/90"
            : restActive
              ? "bg-zinc-900/95"
              : "bg-zinc-950/95"
        }`}
      >
        {restActive ? (
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => adjustRest(-30)}
              className="min-h-11 min-w-11 rounded-lg bg-zinc-800 px-3 text-sm font-semibold transition active:bg-zinc-700"
            >
              -30s
            </button>
            <div className="text-center">
              <p className="text-3xl font-bold tabular-nums">
                {formatClock(restLeft)}
              </p>
              <p className="text-xs text-zinc-400">descanso</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => adjustRest(30)}
                className="min-h-11 min-w-11 rounded-lg bg-zinc-800 px-3 text-sm font-semibold transition active:bg-zinc-700"
              >
                +30s
              </button>
              <button
                type="button"
                onClick={() => setRestEndsAt(null)}
                className="min-h-11 min-w-11 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-400 transition active:bg-zinc-800"
              >
                Pular
              </button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-11 items-center justify-between">
            <p
              className={`text-sm font-semibold ${restDone ? "text-white" : "text-zinc-400"}`}
            >
              {restDone ? "Descanso concluído — próxima série!" : "Treino livre"}
            </p>
            {!restDone && (
              <button
                type="button"
                onClick={startRest}
                className="min-h-11 rounded-lg bg-zinc-800 px-4 text-sm font-semibold transition active:bg-zinc-700"
              >
                Descanso {REST_DEFAULT_SEC}s
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 p-4">
        {/* Exercícios */}
        {session.exercises.map((exercise) => {
          const draft = draftFor(exercise.id);
          const e1rm = bestE1rm(exercise);
          return (
            <section
              key={exercise.id}
              className="space-y-3 rounded-lg bg-zinc-900 p-4"
            >
              <header className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold">
                    {exerciseName(exercise.exerciseId)}
                  </h2>
                  {e1rm > 0 && (
                    <p className="text-xs text-emerald-400">
                      e1RM {formatKg(Math.round(e1rm * 10) / 10)} kg
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeExercise(exercise.id)}
                  aria-label={`Remover ${exerciseName(exercise.exerciseId)}`}
                  className="min-h-11 min-w-11 rounded-lg text-zinc-500 transition active:bg-zinc-800"
                >
                  ✕
                </button>
              </header>

              {/* Séries confirmadas */}
              {exercise.sets.length > 0 && (
                <ul className="space-y-1">
                  {exercise.sets.map((set) => (
                    <li
                      key={set.id}
                      className="flex items-center justify-between rounded-lg bg-zinc-800/60 px-3 py-2 text-sm"
                    >
                      <span className="text-zinc-400">#{set.order}</span>
                      <span className="font-medium tabular-nums">
                        {set.reps} reps
                        {set.loadKg != null && ` × ${formatKg(set.loadKg)} kg`}
                        {set.rpe != null && (
                          <span className="text-zinc-400"> @ {set.rpe}</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSet(exercise.id, set.id)}
                        aria-label={`Remover série ${set.order}`}
                        className="min-h-11 min-w-11 rounded-lg text-zinc-500 transition active:bg-zinc-700"
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
                  <div className="flex items-center rounded-lg bg-zinc-800">
                    <button
                      type="button"
                      onClick={() =>
                        setDraft(exercise.id, {
                          reps: Math.max(0, draft.reps - 1),
                        })
                      }
                      aria-label="Menos uma repetição"
                      className="min-h-11 min-w-11 text-lg font-bold transition active:bg-zinc-700"
                    >
                      −
                    </button>
                    <span className="min-w-12 text-center text-base font-semibold tabular-nums">
                      {draft.reps}
                      <span className="block text-[10px] font-normal text-zinc-400">
                        reps
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft(exercise.id, { reps: draft.reps + 1 })
                      }
                      aria-label="Mais uma repetição"
                      className="min-h-11 min-w-11 text-lg font-bold transition active:bg-zinc-700"
                    >
                      +
                    </button>
                  </div>

                  {/* Carga */}
                  <label className="flex-1">
                    <span className="sr-only">Carga em kg</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="kg"
                      value={draft.load}
                      onChange={(e) =>
                        setDraft(exercise.id, { load: e.target.value })
                      }
                      className="min-h-11 w-full rounded-lg bg-zinc-800 px-3 text-center text-base font-semibold outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-emerald-500"
                    />
                  </label>

                  {/* RPE */}
                  <label>
                    <span className="sr-only">RPE da série</span>
                    <select
                      value={draft.rpe}
                      onChange={(e) =>
                        setDraft(exercise.id, { rpe: e.target.value })
                      }
                      className="min-h-11 rounded-lg bg-zinc-800 px-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">RPE</option>
                      {RPE_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => confirmSet(exercise.id)}
                    className="min-h-12 flex-1 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition active:bg-emerald-500"
                  >
                    Confirmar série
                  </button>
                  {exercise.sets.length > 0 && (
                    <button
                      type="button"
                      onClick={() => repeatLastSet(exercise)}
                      className="min-h-12 rounded-lg border border-zinc-700 px-4 text-sm font-semibold text-zinc-300 transition active:bg-zinc-800"
                    >
                      Repetir última
                    </button>
                  )}
                </div>
              </div>
            </section>
          );
        })}

        {/* Adicionar exercício */}
        {showPicker ? (
          <section className="space-y-2 rounded-lg bg-zinc-900 p-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Buscar exercício…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-h-11 w-full rounded-lg bg-zinc-800 px-3 text-base outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => {
                  setShowPicker(false);
                  setSearch("");
                }}
                aria-label="Fechar busca"
                className="min-h-11 min-w-11 rounded-lg text-zinc-500 transition active:bg-zinc-800"
              >
                ✕
              </button>
            </div>
            <ul className="max-h-64 space-y-1 overflow-y-auto">
              {filtered.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => addExercise(e.id)}
                    className="min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm transition active:bg-zinc-800"
                  >
                    {e.name}
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-zinc-500">
                  Nenhum exercício encontrado.
                </li>
              )}
            </ul>
          </section>
        ) : (
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="min-h-12 w-full rounded-lg border border-dashed border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-300 transition active:bg-zinc-900"
          >
            + Adicionar exercício
          </button>
        )}

        {/* Finalizar */}
        {session.exercises.length > 0 && (
          <button
            type="button"
            onClick={() => setAskingSrpe(true)}
            className="min-h-12 w-full rounded-lg bg-zinc-100 px-4 py-3 text-base font-semibold text-zinc-950 transition active:bg-zinc-300"
          >
            Finalizar treino
          </button>
        )}
      </div>

      {/* Overlay de sRPE */}
      {askingSrpe && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg space-y-4 rounded-lg bg-zinc-900 p-4">
            <div>
              <h2 className="text-lg font-semibold">Esforço da sessão</h2>
              <p className="text-sm text-zinc-400">
                De 0 (repouso) a 10 (máximo), quão pesado foi o treino inteiro?
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {SRPE_OPTIONS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => finishSession(v)}
                  className="min-h-12 rounded-lg bg-zinc-800 text-base font-semibold transition active:bg-emerald-600"
                >
                  {v}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setAskingSrpe(false)}
              className="min-h-11 w-full rounded-lg border border-zinc-700 px-4 text-sm text-zinc-400 transition active:bg-zinc-800"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
