import { isPerformedExercise } from "@bstrainer/domain";
import type { Exercise, MuscleGroup, WorkoutSession } from "@bstrainer/domain";

/**
 * Séries semanais por grupo muscular — a métrica de volume com melhor suporte
 * na literatura de hipertrofia (Schoenfeld et al.).
 * Séries de músculos secundários contam fracionadas (default 0.5).
 */
export function weeklySetsPerMuscleGroup(
  sessions: WorkoutSession[],
  exerciseById: Map<string, Exercise>,
  secondaryWeight = 0.5,
): Map<MuscleGroup, number> {
  const totals = new Map<MuscleGroup, number>();
  const add = (group: MuscleGroup, amount: number) => {
    totals.set(group, (totals.get(group) ?? 0) + amount);
  };

  for (const session of sessions) {
    for (const performed of session.blocks.filter(isPerformedExercise)) {
      const exercise = exerciseById.get(performed.exerciseId);
      if (!exercise) continue;
      const workSets = performed.sets.filter((s) => !s.isWarmup).length;
      if (workSets === 0) continue;
      for (const group of exercise.primaryMuscles) add(group, workSets);
      for (const group of exercise.secondaryMuscles)
        add(group, workSets * secondaryWeight);
    }
  }
  return totals;
}
