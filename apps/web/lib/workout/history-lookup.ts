import { isPerformedExercise, type WorkoutSession } from "@bstrainer/domain";
import { e1rmEpley } from "@bstrainer/engine";
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
