import type { WorkoutSession } from "@bstrainer/domain";

const DAY_MS = 86_400_000;

function mondayOf(date: Date): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dow = (d.getUTCDay() + 6) % 7; // 0 = segunda
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

/**
 * Streak de semanas consecutivas com ao menos um treino, contando pra trás
 * a partir da semana de `today`. Por semana (não por dia) — não pune descanso,
 * padrão de apps que não geram culpa (Nike/Gravl).
 */
export function weeklyStreak(
  sessions: WorkoutSession[],
  today = new Date(),
): number {
  const trained = new Set<string>();
  for (const s of sessions) {
    if (s.status !== "completed") continue;
    trained.add(mondayOf(new Date(s.startedAt)));
  }
  if (trained.size === 0) return 0;

  let streak = 0;
  const cursor = new Date(`${mondayOf(today)}T00:00:00Z`);
  // Semana atual só conta se já treinou; senão começa a contar da anterior.
  if (!trained.has(cursor.toISOString().slice(0, 10))) {
    cursor.setUTCDate(cursor.getUTCDate() - 7);
  }
  while (trained.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 7);
  }
  return streak;
}

export interface HeatmapCell {
  date: string;
  count: number;
}

/**
 * Contagem de treinos por dia nos últimos `days` dias (heatmap estilo GitHub).
 * Série cronológica completa, incluindo dias com 0.
 */
export function frequencyHeatmap(
  sessions: WorkoutSession[],
  days = 91,
  today = new Date(),
): HeatmapCell[] {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    if (s.status !== "completed") continue;
    const key = s.startedAt.slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const cells: HeatmapCell[] = [];
  const end = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(end - i * DAY_MS).toISOString().slice(0, 10);
    cells.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return cells;
}
