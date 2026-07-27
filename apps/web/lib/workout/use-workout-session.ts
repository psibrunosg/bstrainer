"use client";

import { useEffect, useState, useRef } from "react";
import {
  isPerformedExercise,
  type PerformedActivity,
  type PerformedCircuit,
  type PerformedExercise,
  type PerformedSet,
  type PrescribedSet,
  type WorkoutBlock,
  type WorkoutSession,
} from "@bstrainer/domain";
import { fetchWorkoutTemplate, type NextWorkout } from "@/lib/data/active-plan";
import { e1rmEpley } from "@bstrainer/engine";
import type { ExerciseOption } from "@/lib/data/plans";
import { syncSession } from "@/lib/workout/sync";
import {
  bestHistoricalE1rm,
  lastPerformanceFor,
  type LastPerformance,
} from "@/lib/workout/history-lookup";
import {
  appendToSessionHistory,
  clearActiveSession,
  loadActiveSession,
  saveActiveSession,
} from "@/lib/workout/storage";

export interface SetDraft {
  reps: number;
  load: string;
  rpe: string;
}

function parseLoad(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function useWorkoutSession() {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, SetDraft>>({});

  // Última performance por exercício (histórico) — ghost/prefill
  const [lastPerf, setLastPerf] = useState<Record<string, LastPerformance | null>>({});
  // Melhor e1RM histórico por exercício (baseline de PR, congelado no add)
  const prBaseline = useRef<Record<string, number>>({});
  // Exercícios que bateram PR nesta sessão -> valor do PR
  const [prHit, setPrHit] = useState<Record<string, number>>({});

  // Substituição de exercício — nome/mídia de substitutos vindos do Supabase
  // podem não estar no catálogo local (EXERCISES), então guardamos override aqui.
  const [substituteOverride, setSubstituteOverride] = useState<
    Record<string, { name: string; mediaUrl: string | null }>
  >({});

  // Meta prescrita (quando a sessão vem de um treino atribuído) — id do block
  // prescrito -> block, pra mostrar reps/carga/RPE alvo e pré-preencher o draft.
  const [prescribedById, setPrescribedById] = useState<Record<string, WorkoutBlock>>({});
  const [activityInfo, setActivityInfo] = useState<NextWorkout["activityInfo"]>({});

  // Finalização
  const [finished, setFinished] = useState<WorkoutSession | null>(null);

  useEffect(() => {
    loadActiveSession().then(async (active) => {
      setSession(active);
      setLoaded(true);
      // pré-carrega última performance e baseline de PR dos exercícios já na sessão
      if (active) {
        const perf: Record<string, LastPerformance | null> = {};
        for (const ex of active.blocks.filter(isPerformedExercise)) {
          perf[ex.exerciseId] = await lastPerformanceFor(ex.exerciseId);
          prBaseline.current[ex.exerciseId] = await bestHistoricalE1rm(ex.exerciseId);
        }
        setLastPerf(perf);

        if (active.workoutTemplateId) {
          const workout = await fetchWorkoutTemplate(active.workoutTemplateId);
          if (workout) {
            const byId: Record<string, WorkoutBlock> = {};
            for (const block of workout.template.blocks) byId[block.id] = block;
            setPrescribedById(byId);
            setActivityInfo(workout.activityInfo);
          }
        }
      }
    });
  }, []);

  useEffect(() => {
    if (session && session.status === "in_progress") {
      // fire-and-forget: escrita no IndexedDB não deve travar o input a cada série
      void saveActiveSession(session);
    }
  }, [session]);

  function targetSetFor(rowId: string): PrescribedSet | undefined {
    const block = session?.blocks.find((b) => b.id === rowId);
    if (!block || block.kind !== "exercise" || !block.prescribedExerciseId) return undefined;
    const prescribed = prescribedById[block.prescribedExerciseId];
    if (!prescribed || prescribed.kind !== "exercise") return undefined;
    return prescribed.sets[block.sets.length] ?? prescribed.sets[prescribed.sets.length - 1];
  }

  function draftFor(rowId: string, exerciseId: string): SetDraft {
    const existing = drafts[rowId];
    if (existing) return existing;
    const target = targetSetFor(rowId);
    if (target) {
      return {
        reps: target.repsMin,
        load:
          target.loadMethod === "absolute" && target.loadValue != null
            ? String(target.loadValue)
            : "",
        rpe: target.targetRpe != null ? String(target.targetRpe) : "",
      };
    }
    const last = lastPerf[exerciseId];
    return { reps: last?.reps ?? 8, load: "", rpe: "" };
  }

  function setDraft(rowId: string, exerciseId: string, patch: Partial<SetDraft>) {
    setDrafts((prev) => ({
      ...prev,
      [rowId]: { ...draftFor(rowId, exerciseId), ...patch },
    }));
  }

  async function addExercise(exerciseId: string) {
    const last = await lastPerformanceFor(exerciseId);
    setLastPerf((prev) => ({ ...prev, [exerciseId]: last }));
    prBaseline.current[exerciseId] = await bestHistoricalE1rm(exerciseId);
    setSession((prev) => {
      if (!prev) return prev;
      const row: PerformedExercise & { kind: "exercise" } = {
        kind: "exercise",
        id: crypto.randomUUID(),
        exerciseId,
        prescribedExerciseId: null,
        order: prev.blocks.length + 1,
        wasSubstituted: false,
        sets: [],
      };
      return { ...prev, blocks: [...prev.blocks, row] };
    });
  }

  function applySubstitute(rowId: string, option: ExerciseOption) {
    setSubstituteOverride((prev) => ({
      ...prev,
      [option.id]: { name: option.name, mediaUrl: option.mediaUrl },
    }));
    setSession((prev) => {
      if (!prev) return prev;
      const blocks = prev.blocks.map((e) =>
        e.kind === "exercise" && e.id === rowId
          ? { ...e, exerciseId: option.id, wasSubstituted: true }
          : e,
      );
      return { ...prev, blocks };
    });
  }

  function removeExercise(rowId: string) {
    setSession((prev) => {
      if (!prev) return prev;
      const blocks = prev.blocks
        .filter((e) => e.id !== rowId)
        .map((e, i) => ({ ...e, order: i + 1 }));
      return { ...prev, blocks };
    });
  }

  function checkPr(exerciseId: string, set: PerformedSet) {
    if (set.loadKg == null) return;
    const e = e1rmEpley(set.loadKg, set.reps);
    const baseline = prBaseline.current[exerciseId] ?? 0;
    const currentSessionBest = prHit[exerciseId] ?? 0;
    if (e > baseline && e > currentSessionBest) {
      setPrHit((prev) => ({ ...prev, [exerciseId]: e }));
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(30);
      }
    }
  }

  function appendSet(
    rowId: string,
    exerciseId: string,
    set: Omit<PerformedSet, "id" | "order">,
  ) {
    const newSet: PerformedSet = { ...set, id: crypto.randomUUID(), order: 0 };
    setSession((prev) => {
      if (!prev) return prev;
      const blocks = prev.blocks.map((e) => {
        if (e.kind !== "exercise" || e.id !== rowId) return e;
        return {
          ...e,
          sets: [...e.sets, { ...newSet, order: e.sets.length + 1 }],
        };
      });
      return { ...prev, blocks };
    });
    checkPr(exerciseId, newSet);
  }

  function confirmSet(rowId: string, exerciseId: string) {
    const d = draftFor(rowId, exerciseId);
    appendSet(rowId, exerciseId, {
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
    appendSet(exercise.id, exercise.exerciseId, {
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

  function updateActivity(
    rowId: string,
    patch: Partial<Pick<PerformedActivity, "durationSeconds" | "distanceKm" | "avgPaceMinPerKm" | "rpe">>,
  ) {
    setSession((prev) => {
      if (!prev) return prev;
      const blocks = prev.blocks.map((b) =>
        b.kind === "activity" && b.id === rowId ? { ...b, ...patch } : b,
      );
      return { ...prev, blocks };
    });
  }

  function updateCircuit(
    rowId: string,
    patch: Partial<Pick<PerformedCircuit, "roundsCompleted" | "rpe">>,
  ) {
    setSession((prev) => {
      if (!prev) return prev;
      const blocks = prev.blocks.map((b) =>
        b.kind === "circuit" && b.id === rowId ? { ...b, ...patch } : b,
      );
      return { ...prev, blocks };
    });
  }

  function removeSet(rowId: string, setId: string) {
    setSession((prev) => {
      if (!prev) return prev;
      const blocks = prev.blocks.map((e) => {
        if (e.kind !== "exercise" || e.id !== rowId) return e;
        const sets = e.sets
          .filter((s) => s.id !== setId)
          .map((s, i) => ({ ...s, order: i + 1 }));
        return { ...e, sets };
      });
      return { ...prev, blocks };
    });
  }

  async function finishSession(srpe: number) {
    if (!session) return;
    const done: WorkoutSession = {
      ...session,
      finishedAt: new Date().toISOString(),
      status: "completed",
      sessionRpe: srpe,
    };
    await appendToSessionHistory(done);
    await clearActiveSession();
    setFinished(done);
    setSession(done);
    void syncSession(done);
  }

  return {
    session,
    loaded,
    finished,
    lastPerf,
    prHit,
    substituteOverride,
    prescribedById,
    activityInfo,
    draftFor,
    setDraft,
    targetSetFor,
    addExercise,
    removeExercise,
    applySubstitute,
    confirmSet,
    repeatLastSet,
    removeSet,
    updateActivity,
    updateCircuit,
    finishSession,
  };
}
