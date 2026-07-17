/** IDs fixos dos quatro grandes básicos, copiados de apps/web/lib/workout/exercises.ts. */
export const KEY_LIFT_IDS = {
  squat: "5b6f3f2a-1c9d-4e8b-9a01-000000000001",
  bench: "5b6f3f2a-1c9d-4e8b-9a01-000000000002",
  deadlift: "5b6f3f2a-1c9d-4e8b-9a01-000000000003",
  overheadPress: "5b6f3f2a-1c9d-4e8b-9a01-000000000005",
} as const;

// ponytail: proporção única por levantador intermediário, sem split de sexo/idade.
// Upgrade: tabelas de ratio por sexo/nível quando AthleteProfile.level/sex entrarem no cálculo.
const BODYWEIGHT_RATIOS: Record<keyof typeof KEY_LIFT_IDS, number> = {
  squat: 1.5,
  bench: 1.0,
  deadlift: 1.75,
  overheadPress: 0.6,
};

const MAX_LIFT_SCORE = 200;

/**
 * Score de força nos quatro grandes básicos, 0-200 por levantamento,
 * relativo ao peso corporal. Deriva de e1RM já calculado, nunca armazenado.
 */
export function computeStrengthScore(
  bestE1rmByExercise: Record<string, number>,
  bodyweightKg: number | null,
): { overall: number | null; lifts: { key: string; e1rmKg: number; score: number }[] } {
  if (bodyweightKg == null || bodyweightKg <= 0) {
    return { overall: null, lifts: [] };
  }

  const lifts: { key: string; e1rmKg: number; score: number }[] = [];
  for (const key of Object.keys(KEY_LIFT_IDS) as (keyof typeof KEY_LIFT_IDS)[]) {
    const id = KEY_LIFT_IDS[key];
    const e1rmKg = bestE1rmByExercise[id];
    if (e1rmKg == null || e1rmKg <= 0) continue;
    const ratio = BODYWEIGHT_RATIOS[key];
    const score = Math.min(
      MAX_LIFT_SCORE,
      Math.round((e1rmKg / (bodyweightKg * ratio)) * 100),
    );
    lifts.push({ key, e1rmKg, score });
  }

  if (lifts.length === 0) return { overall: null, lifts: [] };

  const overall = Math.round(
    lifts.reduce((sum, l) => sum + l.score, 0) / lifts.length,
  );
  return { overall, lifts };
}
