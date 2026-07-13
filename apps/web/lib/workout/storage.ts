import { workoutSessionSchema, type WorkoutSession } from "@bstrainer/domain";

/**
 * Persistência local do logger (pré-Supabase).
 * Os dados já seguem o schema WorkoutSession de @bstrainer/domain,
 * então a migração para o banco é só trocar a camada de storage.
 */
export const ACTIVE_SESSION_KEY = "bstrainer.activeSession";
export const SESSION_HISTORY_KEY = "bstrainer.sessionHistory";

/** clientId placeholder até existir auth/Supabase. */
export const LOCAL_CLIENT_ID = "00000000-0000-4000-8000-000000000001";

export function loadActiveSession(): WorkoutSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(ACTIVE_SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = workoutSessionSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveActiveSession(session: WorkoutSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
}

export function clearActiveSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACTIVE_SESSION_KEY);
}

export function loadSessionHistory(): WorkoutSession[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(SESSION_HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => workoutSessionSchema.safeParse(item))
      .filter((r) => r.success)
      .map((r) => r.data);
  } catch {
    return [];
  }
}

export function appendToSessionHistory(session: WorkoutSession): void {
  if (typeof window === "undefined") return;
  const history = loadSessionHistory();
  history.push(session);
  window.localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(history));
}

export function createFreeSession(): WorkoutSession {
  return {
    id: crypto.randomUUID(),
    clientId: LOCAL_CLIENT_ID,
    workoutTemplateId: null,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    status: "in_progress",
    sessionRpe: null,
    readiness: null,
    notes: null,
    exercises: [],
  };
}
