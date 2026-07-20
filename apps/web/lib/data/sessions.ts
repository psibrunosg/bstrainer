import type { PerformedSet, WorkoutSession } from "@bstrainer/domain";
import { createClient } from "@/lib/supabase/client";
import { loadSessionHistory } from "@/lib/workout/storage";

interface DbSet {
  id: string;
  position: number;
  reps: number;
  load_kg: number | null;
  rpe: number | null;
  rir: number | null;
  is_failure: boolean;
  is_warmup: boolean;
  time_seconds: number | null;
  notes: string | null;
}
interface DbExercise {
  id: string;
  exercise_id: string;
  prescribed_exercise_id: string | null;
  position: number;
  was_substituted: boolean;
  performed_sets: DbSet[];
}
interface DbSession {
  id: string;
  client_id: string;
  workout_template_id: string | null;
  started_at: string;
  finished_at: string | null;
  status: string;
  session_rpe: number | null;
  readiness_sleep: number | null;
  readiness_soreness: number | null;
  readiness_energy: number | null;
  notes: string | null;
  performed_exercises: DbExercise[];
}

function toDomain(s: DbSession): WorkoutSession {
  const blocks: WorkoutSession["blocks"] = (s.performed_exercises ?? [])
    .sort((a, b) => a.position - b.position)
    .map((ex) => ({
      kind: "exercise" as const,
      id: ex.id,
      exerciseId: ex.exercise_id,
      prescribedExerciseId: ex.prescribed_exercise_id,
      order: ex.position,
      wasSubstituted: ex.was_substituted,
      sets: (ex.performed_sets ?? [])
        .sort((a, b) => a.position - b.position)
        .map(
          (st): PerformedSet => ({
            id: st.id,
            order: st.position,
            reps: st.reps,
            loadKg: st.load_kg,
            rpe: st.rpe,
            rir: st.rir,
            isFailure: st.is_failure,
            isWarmup: st.is_warmup,
            timeSeconds: st.time_seconds,
            notes: st.notes,
          }),
        ),
    }));
  return {
    id: s.id,
    clientId: s.client_id,
    workoutTemplateId: s.workout_template_id,
    startedAt: s.started_at,
    finishedAt: s.finished_at,
    status: s.status as WorkoutSession["status"],
    sessionRpe: s.session_rpe,
    readiness:
      s.readiness_sleep != null ||
      s.readiness_soreness != null ||
      s.readiness_energy != null
        ? {
            sleep: s.readiness_sleep,
            soreness: s.readiness_soreness,
            energy: s.readiness_energy,
          }
        : null,
    notes: s.notes,
    blocks,
  };
}

/**
 * Histórico de sessões concluídas. Prefere o banco (cross-device); se não
 * logado ou vazio, cai pro histórico local do logger.
 */
/**
 * @param clientId Ver sessões de outro aluno (personal com vínculo ativo). RLS
 * ("staff reads org sessions") garante que só staff da org consegue ler.
 */
export async function loadSessions(clientId?: string): Promise<WorkoutSession[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const targetClientId = clientId ?? user.id;

  const { data, error } = await supabase
    .from("workout_sessions")
    .select(
      "id, client_id, workout_template_id, started_at, finished_at, status, session_rpe, readiness_sleep, readiness_soreness, readiness_energy, notes, performed_exercises(id, exercise_id, prescribed_exercise_id, position, was_substituted, performed_sets(id, position, reps, load_kg, rpe, rir, is_failure, is_warmup, time_seconds, notes))",
    )
    .eq("client_id", targetClientId)
    .eq("status", "completed")
    .order("started_at", { ascending: false });

  if (!error && data && data.length > 0) {
    return (data as unknown as DbSession[]).map(toDomain);
  }

  if (clientId) return [];
  return (await loadSessionHistory()).filter((s) => s.status === "completed");
}
