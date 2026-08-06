import { isPerformedExercise, type WorkoutSession } from "@bstrainer/domain";
import {
  e1rmEpley,
  calculateDeterministicProgression,
  type ProgressionSuggestion,
  type ExerciseSessionRecord,
} from "@bstrainer/engine";
import { loadSessionHistory } from "./storage";

export interface LastPerformance {
  loadKg: number | null;
  reps: number;
  date: string;
}

/**
 * Última série de trabalho registrada para um exercício (histórico local).
 * Usada como ghost/prefill no logger — padrão de todo bom app de treino.
 */
export async function lastPerformanceFor(
  exerciseId: string,
): Promise<LastPerformance | null> {
  const history = (await loadSessionHistory())
    .filter((s) => s.status === "completed")
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  for (const session of history) {
    for (const ex of session.blocks.filter(isPerformedExercise)) {
      if (ex.exerciseId !== exerciseId) continue;
      const workSets = ex.sets.filter((s) => !s.isWarmup);
      const last = workSets[workSets.length - 1];
      if (last) {
        return { loadKg: last.loadKg, reps: last.reps, date: session.startedAt };
      }
    }
  }
  return null;
}

/**
 * Todas as séries de trabalho (sem warmup) da última sessão completa que
 * registrou este exercício, em ordem — usado como "anterior" por linha no
 * logger em tabela (série N mostra o que foi feito na série N da última vez).
 */
export async function lastSessionSetsFor(
  exerciseId: string,
): Promise<LastPerformance[] | null> {
  const history = (await loadSessionHistory())
    .filter((s) => s.status === "completed")
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  for (const session of history) {
    for (const ex of session.blocks.filter(isPerformedExercise)) {
      if (ex.exerciseId !== exerciseId) continue;
      const workSets = ex.sets.filter((s) => !s.isWarmup);
      if (workSets.length === 0) continue;
      return workSets.map((s) => ({
        loadKg: s.loadKg,
        reps: s.reps,
        date: session.startedAt,
      }));
    }
  }
  return null;
}

/**
 * Melhor e1RM histórico de um exercício (para detectar PR).
 * Ignora a sessão ativa — comparação é só contra o passado consolidado.
 */
export async function bestHistoricalE1rm(
  exerciseId: string,
  history?: WorkoutSession[],
): Promise<number> {
  const sessions = (history ?? (await loadSessionHistory())).filter(
    (s) => s.status === "completed",
  );
  let best = 0;
  for (const session of sessions) {
    for (const ex of session.blocks.filter(isPerformedExercise)) {
      if (ex.exerciseId !== exerciseId) continue;
      for (const set of ex.sets) {
        if (set.isWarmup || set.loadKg == null) continue;
        const e = e1rmEpley(set.loadKg, set.reps);
        if (e > best) best = e;
      }
    }
  }
  return best;
}

/**
 * Consulta o histórico consolidado no IndexedDB e invoca a engine determinística
 * para propor carga e repetições explicáveis para a próxima sessão.
 */
export async function getExerciseProgressionSuggestion(
  exerciseId: string,
  fallbackLoad: number,
  fallbackReps: number,
  targetMin = 8,
  targetMax = 12,
): Promise<ProgressionSuggestion> {
  const history = (await loadSessionHistory())
    .filter((s) => s.status === "completed")
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  const recentSessions: ExerciseSessionRecord[] = [];

  for (const session of history) {
    for (const ex of session.blocks.filter(isPerformedExercise)) {
      if (ex.exerciseId !== exerciseId) continue;
      const workSets = ex.sets.filter((s) => !s.isWarmup && s.loadKg != null);
      if (workSets.length === 0) continue;
      const mainSet = workSets[workSets.length - 1];
      if (mainSet && mainSet.loadKg != null) {
        recentSessions.push({
          load: mainSet.loadKg,
          reps: mainSet.reps,
          rir: mainSet.rir ?? null,
          rpe: mainSet.rpe ?? null,
          soreness: session.readiness?.soreness ?? null,
        });
      }
    }
  }

  if (recentSessions.length === 0) {
    return {
      action: "maintain",
      suggestedLoad: fallbackLoad || 20,
      suggestedReps: targetMax,
      ruleCode: "INITIAL_CALIBRATION",
      badgeLabel: "🎯 Carga Inicial (Calibração)",
      explanation:
        "Regra determinística [INITIAL_CALIBRATION]: Primeira execução deste exercício no histórico do app. Selecione uma carga moderada (RPE ~7-8) que permita atingir a meta com boa técnica para estabelecer a linha de base do motor.",
    };
  }

  const lastRec = recentSessions[0];
  return calculateDeterministicProgression({
    currentLoad: lastRec?.load ?? fallbackLoad ?? 20,
    currentReps: lastRec?.reps ?? fallbackReps ?? targetMax,
    targetRepsMin: targetMin,
    targetRepsMax: targetMax,
    recentSessions,
  });
}

