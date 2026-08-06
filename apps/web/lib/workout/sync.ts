import { isPerformedExercise, type WorkoutSession } from "@bstrainer/domain";
import { getTrainingOrgId } from "@/lib/data/memberships";
import { createClient } from "@/lib/supabase/client";
import {
  dequeueSyncSession,
  enqueueSyncSession,
  loadSyncQueue,
} from "@/lib/workout/storage";

/**
 * Sync de sessões finalizadas pro Supabase de forma estritamente idempotente (upsert).
 * Fila offline em IndexedDB via idb: falhou → guarda em syncQueue, tenta de novo depois sem duplicar.
 */
export async function loadPending(): Promise<WorkoutSession[]> {
  return await loadSyncQueue();
}

export async function enqueue(session: WorkoutSession): Promise<void> {
  await enqueueSyncSession(session);
}

/** Empurra uma sessão pro banco de forma idempotente via upsert. Lança em falha. */
export async function pushSession(session: WorkoutSession): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not-authenticated");

  const orgId = await getTrainingOrgId();
  if (!orgId) throw new Error("no-membership");

  const { error: sErr } = await supabase.from("workout_sessions").upsert(
    {
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
    },
    { onConflict: "id" },
  );
  if (sErr) throw sErr;

  for (const ex of session.blocks.filter(isPerformedExercise)) {
    const { error: eErr } = await supabase.from("performed_exercises").upsert(
      {
        id: ex.id,
        session_id: session.id,
        exercise_id: ex.exerciseId,
        prescribed_exercise_id: ex.prescribedExerciseId,
        position: ex.order,
        was_substituted: ex.wasSubstituted,
      },
      { onConflict: "id" },
    );
    if (eErr) throw eErr;

    if (ex.sets.length > 0) {
      const { error: setErr } = await supabase.from("performed_sets").upsert(
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
        { onConflict: "id" },
      );
      if (setErr) throw setErr;
    }
  }

  for (const activity of session.blocks.filter(
    (b): b is Extract<typeof b, { kind: "activity" }> => b.kind === "activity",
  )) {
    const { error: aErr } = await supabase.from("performed_activities").upsert(
      {
        id: activity.id,
        session_id: session.id,
        activity_id: activity.activityId,
        prescribed_activity_id: activity.prescribedActivityId,
        position: activity.order,
        duration_seconds: activity.durationSeconds,
        distance_km: activity.distanceKm,
        avg_pace_min_per_km: activity.avgPaceMinPerKm,
        rpe: activity.rpe,
      },
      { onConflict: "id" },
    );
    if (aErr) throw aErr;
  }

  for (const circuit of session.blocks.filter(
    (b): b is Extract<typeof b, { kind: "circuit" }> => b.kind === "circuit",
  )) {
    const { error: cErr } = await supabase.from("performed_circuits").upsert(
      {
        id: circuit.id,
        session_id: session.id,
        prescribed_circuit_id: circuit.prescribedCircuitId,
        position: circuit.order,
        rounds_completed: circuit.roundsCompleted,
        rpe: circuit.rpe,
      },
      { onConflict: "id" },
    );
    if (cErr) throw cErr;
  }
}

/** Tenta sincronizar uma sessão agora; em falha, enfileira no idb. */
export async function syncSession(session: WorkoutSession): Promise<boolean> {
  try {
    await pushSession(session);
    await dequeueSyncSession(session.id);
    return true;
  } catch {
    await enqueue(session);
    return false;
  }
}

/** Drena a fila pendente no idb (chamar em app load / reconexão). */
export async function drainPending(): Promise<number> {
  const pending = await loadPending();
  if (pending.length === 0) return 0;
  let synced = 0;
  for (const session of pending) {
    try {
      await pushSession(session);
      await dequeueSyncSession(session.id);
      synced++;
    } catch (err) {
      // duplicata ou erro não-resgatável não volta pra fila
      const code = (err as { code?: string })?.code;
      if (code === "23505") {
        await dequeueSyncSession(session.id);
      }
    }
  }
  return synced;
}
