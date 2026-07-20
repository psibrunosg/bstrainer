import { isPerformedExercise } from "@bstrainer/domain";
import type { WorkoutSession } from "@bstrainer/domain";

/**
 * Carga interna de sessão pelo método de Foster: sRPE (0-10) x duração em minutos.
 * Retorna null se faltar sRPE ou horários.
 */
export function sessionLoad(session: WorkoutSession): number | null {
  if (session.sessionRpe == null || session.finishedAt == null) return null;
  const start = Date.parse(session.startedAt);
  const end = Date.parse(session.finishedAt);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  const minutes = (end - start) / 60_000;
  return Math.round(session.sessionRpe * minutes);
}

/** Tonelagem da sessão: soma de reps x carga das séries válidas (ignora warmup). */
export function sessionTonnage(session: WorkoutSession): number {
  let total = 0;
  for (const ex of session.blocks.filter(isPerformedExercise)) {
    for (const set of ex.sets) {
      if (set.isWarmup || set.loadKg == null) continue;
      total += set.reps * set.loadKg;
    }
  }
  return total;
}
