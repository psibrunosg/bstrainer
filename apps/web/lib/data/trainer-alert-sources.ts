import type { WorkoutSession } from "@bstrainer/domain";
import type { ClientLink } from "./clients";
import { mapSessionRow } from "./sessions";
import { createClient } from "../supabase/client";

const SESSION_SELECT =
  "id, client_id, workout_template_id, started_at, finished_at, status, session_rpe, readiness_sleep, readiness_soreness, readiness_energy, notes, performed_exercises(id, exercise_id, prescribed_exercise_id, position, was_substituted, performed_sets(id, position, reps, load_kg, rpe, rir, is_failure, is_warmup, time_seconds, notes))";

type ClientLinkRow = Omit<ClientLink, "name"> & {
  profiles: { name: string } | null;
};

export type ClientLinkLoadResult =
  | { ok: true; clients: ClientLink[] }
  | { ok: false; error: string };

export type ClientSessionLoadResult =
  | { ok: true; sessions: WorkoutSession[] }
  | { ok: false; error: string };

export async function listActiveClientLinksForAlerts(): Promise<ClientLinkLoadResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const { data, error } = await supabase
    .from("client_links")
    .select("id, status, invite_email, client_id, profiles:client_id(name)")
    .eq("trainer_id", user.id)
    .eq("status", "active")
    .order("status", { ascending: true });

  if (error) return { ok: false, error: "Falha ao carregar alunos." };

  const clients = ((data ?? []) as unknown as ClientLinkRow[]).map((link) => ({
    id: link.id,
    status: link.status,
    invite_email: link.invite_email,
    client_id: link.client_id,
    name: link.profiles?.name ?? null,
  }));
  return { ok: true, clients };
}

export async function loadCompletedClientSessionsForAlerts(
  clientId: string,
): Promise<ClientSessionLoadResult> {
  const { data, error } = await createClient()
    .from("workout_sessions")
    .select(SESSION_SELECT)
    .eq("client_id", clientId)
    .eq("status", "completed")
    .order("started_at", { ascending: false });

  if (error) return { ok: false, error: "Falha ao carregar sessões do aluno." };
  return { ok: true, sessions: (data ?? []).map(mapSessionRow) };
}
