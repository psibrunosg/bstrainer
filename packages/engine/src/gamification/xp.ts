import { isPerformedExercise } from "@bstrainer/domain";
import type { WorkoutSession } from "@bstrainer/domain";
import { sessionTonnage } from "../progression/session-load";

/**
 * XP e nível derivados do histórico de sessões — nunca armazenados.
 * Por sessão completa: 10 base + 2 x séries válidas + 5 x toneladas levantadas.
 * Curva de nível: level = 1 + sqrt(xp / 100).
 */
export function computeXp(
  sessions: WorkoutSession[],
): { xp: number; level: number; xpIntoLevel: number; xpForNextLevel: number } {
  let xp = 0;
  for (const session of sessions) {
    if (session.status !== "completed") continue;
    const validSets = session.blocks.filter(isPerformedExercise).reduce(
      (count, ex) => count + ex.sets.filter((s) => !s.isWarmup).length,
      0,
    );
    const tonnes = sessionTonnage(session) / 1000;
    xp += 10 + 2 * validSets + 5 * Math.round(tonnes);
  }

  const level = 1 + Math.floor(Math.sqrt(xp / 100));
  const xpForLevelStart = (level - 1) ** 2 * 100;
  const xpForNextLevelStart = level ** 2 * 100;
  const xpIntoLevel = xp - xpForLevelStart;
  const xpForNextLevel = xpForNextLevelStart - xpForLevelStart;

  return { xp, level, xpIntoLevel, xpForNextLevel };
}
