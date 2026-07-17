import { createClient } from "@/lib/supabase/client";

export type GoalKind = "exercise_1rm" | "weekly_frequency";

export interface Goal {
  id: string;
  kind: GoalKind;
  exerciseId: string | null;
  exerciseName: string | null;
  targetValue: number;
  createdAt: string;
}

interface GoalRow {
  id: string;
  kind: GoalKind;
  exercise_id: string | null;
  target_value: number;
  created_at: string;
  exercises: { name: string } | null;
}

export async function listGoals(): Promise<Goal[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("athlete_goals")
    .select("id, kind, exercise_id, target_value, created_at, exercises(name)")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  return ((data ?? []) as unknown as GoalRow[]).map((r) => ({
    id: r.id,
    kind: r.kind,
    exerciseId: r.exercise_id,
    exerciseName: r.exercises?.name ?? null,
    targetValue: r.target_value,
    createdAt: r.created_at,
  }));
}

export interface CreateGoalInput {
  kind: GoalKind;
  exerciseId: string | null;
  targetValue: number;
}

export interface GoalResult {
  ok: boolean;
  error?: string;
}

export async function createGoal(input: CreateGoalInput): Promise<GoalResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const { error } = await supabase.from("athlete_goals").insert({
    profile_id: user.id,
    kind: input.kind,
    exercise_id: input.exerciseId,
    target_value: input.targetValue,
  });
  if (error) return { ok: false, error: "Falha ao criar meta." };

  return { ok: true };
}

export async function deleteGoal(id: string): Promise<GoalResult> {
  const supabase = createClient();
  const { error } = await supabase.from("athlete_goals").delete().eq("id", id);
  if (error) return { ok: false, error: "Falha ao remover meta." };

  return { ok: true };
}
