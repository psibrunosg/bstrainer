import { isPerformedExercise } from "@bstrainer/domain";
import type { WorkoutSession } from "@bstrainer/domain";
import { sessionTonnage } from "../progression/session-load";

export interface BadgeContext {
  completedCount: number;
  weeklyStreak: number;
  maxSessionTonnageKg: number;
  totalSets: number;
}

/** Deriva o contexto de badges a partir do histórico. weeklyStreak vem de fora (já calculado por weeklyStreak()). */
export function buildBadgeContext(
  sessions: WorkoutSession[],
  weeklyStreakValue: number,
): BadgeContext {
  let completedCount = 0;
  let maxSessionTonnageKg = 0;
  let totalSets = 0;

  for (const session of sessions) {
    if (session.status !== "completed") continue;
    completedCount++;
    maxSessionTonnageKg = Math.max(maxSessionTonnageKg, sessionTonnage(session));
    for (const ex of session.blocks.filter(isPerformedExercise)) {
      totalSets += ex.sets.filter((s) => !s.isWarmup).length;
    }
  }

  return { completedCount, weeklyStreak: weeklyStreakValue, maxSessionTonnageKg, totalSets };
}

interface BadgeDef {
  key: string;
  label: string;
  description: string;
  earned: (ctx: BadgeContext) => boolean;
}

const BADGE_CATALOG: BadgeDef[] = [
  {
    key: "first_workout",
    label: "Primeiro treino",
    description: "Complete seu primeiro treino",
    earned: (ctx) => ctx.completedCount >= 1,
  },
  {
    key: "ten_workouts",
    label: "Dez treinos",
    description: "Complete 10 treinos",
    earned: (ctx) => ctx.completedCount >= 10,
  },
  {
    key: "fifty_workouts",
    label: "Cinquenta treinos",
    description: "Complete 50 treinos",
    earned: (ctx) => ctx.completedCount >= 50,
  },
  {
    key: "streak_4",
    label: "Sequência de 4 semanas",
    description: "Treine 4 semanas seguidas",
    earned: (ctx) => ctx.weeklyStreak >= 4,
  },
  {
    key: "streak_12",
    label: "Sequência de 12 semanas",
    description: "Treine 12 semanas seguidas",
    earned: (ctx) => ctx.weeklyStreak >= 12,
  },
  {
    key: "heavy_session",
    label: "Sessão pesada",
    description: "Levante 5000kg em uma sessão",
    earned: (ctx) => ctx.maxSessionTonnageKg >= 5000,
  },
  {
    key: "century_sets",
    label: "Cem séries",
    description: "Acumule 100 séries válidas",
    earned: (ctx) => ctx.totalSets >= 100,
  },
];

// ponytail: badges derivados ao vivo, sem earned_at persistido — um badge pode
// sumir se ex. weeklyStreak cair depois. Upgrade: tabela user_badges com
// earned_at se permanência virar requisito de produto.
export function evaluateBadges(
  ctx: BadgeContext,
): { key: string; label: string; description: string; earned: boolean }[] {
  return BADGE_CATALOG.map(({ key, label, description, earned }) => ({
    key,
    label,
    description,
    earned: earned(ctx),
  }));
}
