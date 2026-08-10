import type { ClientLink } from "./clients";
import { createClient } from "../supabase/client";

const SESSION_SELECT =
  "started_at, readiness_soreness, readiness_energy";

type ClientLinkRow = Omit<ClientLink, "name"> & {
  profiles: { name: string } | null;
};

export type ClientLinkLoadResult =
  | { ok: true; clients: ClientLink[] }
  | { ok: false; error: string };

export interface AlertSession {
  startedAt: string;
  readiness: {
    soreness: number | null;
    energy: number | null;
  } | null;
}

export type ClientSessionLoadResult =
  | { ok: true; sessions: AlertSession[] }
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
    .order("started_at", { ascending: false })
    .limit(2);

  if (error) return { ok: false, error: "Falha ao carregar sessões do aluno." };
  return {
    ok: true,
    sessions: (data ?? []).map((session) => ({
      startedAt: session.started_at,
      readiness:
        session.readiness_soreness != null || session.readiness_energy != null
          ? {
              soreness: session.readiness_soreness,
              energy: session.readiness_energy,
            }
          : null,
    })),
  };
}
