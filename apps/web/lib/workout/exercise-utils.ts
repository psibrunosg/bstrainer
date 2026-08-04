import type { PerformedExercise } from "@bstrainer/domain";
import { e1rmEpley } from "@bstrainer/engine";
import type { LastPerformance } from "./history-lookup";

export const RPE_OPTIONS = ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"];

export const ROW_GRID = "grid-cols-[24px_58px_1fr_1fr_52px_40px]";

export function formatKg(kg: number): string {
  return kg % 1 === 0 ? String(kg) : kg.toFixed(1).replace(".", ",");
}

export function anteriorLabel(a?: LastPerformance): string {
  if (!a) return "—";
  return a.loadKg != null ? `${formatKg(a.loadKg)}kg×${a.reps}` : `${a.reps} reps`;
}

export function bestE1rm(exercise: PerformedExercise): number {
  let best = 0;
  for (const set of exercise.sets) {
    if (set.isWarmup || set.loadKg == null) continue;
    const e = e1rmEpley(set.loadKg, set.reps);
    if (e > best) best = e;
  }
  return best;
}
