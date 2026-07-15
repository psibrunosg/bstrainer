import type { WorkoutSession } from "@bstrainer/domain";
import { getTrainingOrgId } from "@/lib/data/memberships";
import { createClient } from "@/lib/supabase/client";

/**
 * Sync de sessões finalizadas pro Supabase.
 * Fila offline em localStorage: falhou → guarda, tenta de novo depois.
 * IDs de exercício locais (hardcoded/custom) que não existem no banco
 * são enviados com exercise_id resolvido por nome quando possível.
 */
const PENDING_KEY = "bstrainer.pendingSync";

export function loadPending(): WorkoutSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function savePending(sessions: WorkoutSession[]): void {
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(sessions));
}

export function enqueue(session: WorkoutSession): void {
  const pending = loadPending();
  if (!pending.some((s) => s.id === session.id)) {
    pending.push(session);
    savePending(pending);
  }
}

/** Empurra uma sessão pro banco. Lança em falha (caller decide enfileirar). */
async function pushSession(session: WorkoutSession): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not-authenticated");

  const orgId = await getTrainingOrgId();
  if (!orgId) throw new Error("no-membership");

  const { error: sErr } = await supabase.from("workout_sessions").insert({
    id: session.id,
    org_id: orgId,
    client_id: user.id,
    workout_template_id: session.workoutTemplateId,
    started_at: session.startedAt,
    finished_at: session.finishedAt,
    status: session.status,
    session_rpe: session.sessionRpe,
    readiness_sleep: session.readiness?.sleep ?? null,
    readiness_soreness: session.readiness?.soreness ?? null,
    readiness_energy: session.readiness?.energy ?? null,
    notes: session.notes,
  });
  if (sErr) throw sErr;

  for (const ex of session.exercises) {
    const { error: eErr } = await supabase.from("performed_exercises").insert({
      id: ex.id,
      session_id: session.id,
      exercise_id: ex.exerciseId,
      prescribed_exercise_id: ex.prescribedExerciseId,
      position: ex.order,
      was_substituted: ex.wasSubstituted,
    });
    if (eErr) throw eErr;

    if (ex.sets.length > 0) {
      const { error: setErr } = await supabase.from("performed_sets").insert(
        ex.sets.map((set) => ({
          id: set.id,
          performed_exercise_id: ex.id,
          position: set.order,
          reps: set.reps,
          load_kg: set.loadKg,
          rpe: set.rpe,
          rir: set.rir,
          is_failure: set.isFailure,
          is_warmup: set.isWarmup,
          time_seconds: set.timeSeconds,
          notes: set.notes,
        })),
      );
      if (setErr) throw setErr;
    }
  }
}

/** Tenta sincronizar uma sessão agora; em falha, enfileira. */
export async function syncSession(session: WorkoutSession): Promise<boolean> {
  try {
    await pushSession(session);
    return true;
  } catch {
    enqueue(session);
    return false;
  }
}

/** Drena a fila pendente (chamar em app load / reconexão). */
export async function drainPending(): Promise<number> {
  const pending = loadPending();
  if (pending.length === 0) return 0;
  const remaining: WorkoutSession[] = [];
  let synced = 0;
  for (const session of pending) {
    try {
      await pushSession(session);
      synced++;
    } catch (err) {
      // duplicata (já sincronizada) não volta pra fila
      const code = (err as { code?: string })?.code;
      if (code !== "23505") remaining.push(session);
    }
  }
  savePending(remaining);
  return synced;
}
