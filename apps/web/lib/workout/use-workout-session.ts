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
  lastSessionSetsFor,
  type LastPerformance,
} from "@/lib/workout/history-lookup";
import { buildSetRows, type SetDraft, type SetRow } from "@/lib/workout/set-rows";
import {
  appendToSessionHistory,
  clearActiveSession,
  loadActiveSession,
  saveActiveSession,
} from "@/lib/workout/storage";

export type { SetDraft, SetRow } from "@/lib/workout/set-rows";

function parseLoad(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function useWorkoutSession() {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, Record<number, SetDraft>>>({});
  const [rowCounts, setRowCounts] = useState<Record<string, number>>({});

  // Última performance por exercício (histórico) — ghost/prefill
  const [lastPerf, setLastPerf] = useState<Record<string, LastPerformance | null>>({});
  // Todas as séries da última sessão por exercício — "anterior" por linha na tabela
  const [lastSessionSets, setLastSessionSets] = useState<Record<string, LastPerformance[] | null>>({});
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
        const perfSets: Record<string, LastPerformance[] | null> = {};
        for (const ex of active.blocks.filter(isPerformedExercise)) {
          perf[ex.exerciseId] = await lastPerformanceFor(ex.exerciseId);
          perfSets[ex.exerciseId] = await lastSessionSetsFor(ex.exerciseId);
          prBaseline.current[ex.exerciseId] = await bestHistoricalE1rm(ex.exerciseId);
        }
        setLastPerf(perf);
        setLastSessionSets(perfSets);

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

  function targetSetAt(rowId: string, index: number): PrescribedSet | undefined {
    const block = session?.blocks.find((b) => b.id === rowId);
    if (!block || block.kind !== "exercise" || !block.prescribedExerciseId) return undefined;
    const prescribed = prescribedById[block.prescribedExerciseId];
    if (!prescribed || prescribed.kind !== "exercise") return undefined;
    return prescribed.sets[index] ?? prescribed.sets[prescribed.sets.length - 1];
  }

  function plannedRowCount(rowId: string): number {
    const block = session?.blocks.find((b) => b.id === rowId);
    if (!block || block.kind !== "exercise" || !block.prescribedExerciseId) return 1;
    const prescribed = prescribedById[block.prescribedExerciseId];
    if (!prescribed || prescribed.kind !== "exercise") return 1;
    return Math.max(prescribed.sets.length, 1);
  }

  function rowCountFor(rowId: string): number {
    return rowCounts[rowId] ?? plannedRowCount(rowId);
  }

  function draftForIndex(rowId: string, exerciseId: string, index: number): SetDraft {
    const existing = drafts[rowId]?.[index];
    if (existing) return existing;
    const target = targetSetAt(rowId, index);
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
    const anterior = lastSessionSets[exerciseId]?.[index];
    if (anterior) {
      return {
        reps: anterior.reps,
        load: anterior.loadKg != null ? String(anterior.loadKg) : "",
        rpe: "",
      };
    }
    const last = lastPerf[exerciseId];
    return { reps: last?.reps ?? 8, load: "", rpe: "" };
  }

  function setDraftAt(rowId: string, exerciseId: string, index: number, patch: Partial<SetDraft>) {
    setDrafts((prev) => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] ?? {}),
        [index]: { ...draftForIndex(rowId, exerciseId, index), ...patch },
      },
    }));
  }

  function rowsFor(rowId: string, exerciseId: string): SetRow[] {
    const block = session?.blocks.find((b) => b.id === rowId);
    if (!block || block.kind !== "exercise") return [];
    return buildSetRows({
      confirmedSets: block.sets,
      rowCount: rowCountFor(rowId),
      targetAt: (index) => targetSetAt(rowId, index),
      anteriorAt: (index) => lastSessionSets[exerciseId]?.[index],
      draftAt: (index) => draftForIndex(rowId, exerciseId, index),
    });
  }

  function addRow(rowId: string) {
    setRowCounts((prev) => ({ ...prev, [rowId]: (prev[rowId] ?? plannedRowCount(rowId)) + 1 }));
  }

  function removeTrailingRow(rowId: string) {
    const block = session?.blocks.find((b) => b.id === rowId);
    if (!block || block.kind !== "exercise") return;
    const count = rowCountFor(rowId);
    if (count - 1 <= block.sets.length) return;
    setRowCounts((prev) => ({ ...prev, [rowId]: count - 1 }));
  }

  async function addExercise(exerciseId: string) {
    const last = await lastPerformanceFor(exerciseId);
    setLastPerf((prev) => ({ ...prev, [exerciseId]: last }));
    const lastSets = await lastSessionSetsFor(exerciseId);
    setLastSessionSets((prev) => ({ ...prev, [exerciseId]: lastSets }));
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

  function confirmActiveRow(rowId: string, exerciseId: string) {
    const block = session?.blocks.find((b) => b.id === rowId);
    if (!block || block.kind !== "exercise") return;
    const index = block.sets.length;
    const d = draftForIndex(rowId, exerciseId, index);
    if (d.reps <= 0) return;
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
    setDrafts((prev) => {
      const rowDrafts = { ...(prev[rowId] ?? {}) };
      delete rowDrafts[index];
      return { ...prev, [rowId]: rowDrafts };
    });
  }

  // ponytail: só a série confirmada mais recente pode reabrir pra edição —
  // reabrir "sobe" um índice arbitrário no meio da lista exigiria reordenar
  // sets com furos, fora de escopo. Editar uma série antiga exige apagar as
  // posteriores primeiro.
  function editLastConfirmedRow(rowId: string) {
    const block = session?.blocks.find((b) => b.id === rowId);
    if (!block || block.kind !== "exercise" || block.sets.length === 0) return;
    const index = block.sets.length - 1;
    const popped = block.sets[index];
    if (!popped) return;
    setDrafts((prev) => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] ?? {}),
        [index]: {
          reps: popped.reps,
          load: popped.loadKg != null ? String(popped.loadKg) : "",
          rpe: popped.rpe != null ? String(popped.rpe) : "",
        },
      },
    }));
    setSession((prev) => {
      if (!prev) return prev;
      const blocks = prev.blocks.map((e) =>
        e.kind === "exercise" && e.id === rowId ? { ...e, sets: e.sets.slice(0, -1) } : e,
      );
      return { ...prev, blocks };
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
    lastSessionSets,
    prHit,
    substituteOverride,
    prescribedById,
    activityInfo,
    rowsFor,
    setDraftAt,
    addRow,
    removeTrailingRow,
    addExercise,
    removeExercise,
    applySubstitute,
    confirmActiveRow,
    editLastConfirmedRow,
    updateActivity,
    updateCircuit,
    finishSession,
  };
}
