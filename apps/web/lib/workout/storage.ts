import { openDB, type IDBPDatabase } from "idb";
import { workoutSessionSchema, type WorkoutSession } from "@bstrainer/domain";

/**
 * Persistência local do logger — IndexedDB (era localStorage).
 * ponytail: appendToSessionHistory agora é upsert por session.id (era push
 * num array serializado), o que também elimina risco de duplicata se uma
 * sessão fosse anexada duas vezes.
 */
const DB_NAME = "bstrainer";
const DB_VERSION = 1;
export const ACTIVE_SESSION_STORE = "activeSession";
export const SESSION_HISTORY_STORE = "sessionHistory";
const ACTIVE_SESSION_KEY = "current";

/** clientId placeholder até existir auth/Supabase. */
export const LOCAL_CLIENT_ID = "00000000-0000-4000-8000-000000000001";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> | null {
  if (typeof window === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore(ACTIVE_SESSION_STORE);
        db.createObjectStore(SESSION_HISTORY_STORE);
      },
    });
  }
  return dbPromise;
}

export async function loadActiveSession(): Promise<WorkoutSession | null> {
  const db = await getDb();
  if (!db) return null;
  const raw = await db.get(ACTIVE_SESSION_STORE, ACTIVE_SESSION_KEY);
  if (!raw) return null;
  const parsed = workoutSessionSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function saveActiveSession(session: WorkoutSession): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.put(ACTIVE_SESSION_STORE, session, ACTIVE_SESSION_KEY);
}

export async function clearActiveSession(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(ACTIVE_SESSION_STORE, ACTIVE_SESSION_KEY);
}

export async function loadSessionHistory(): Promise<WorkoutSession[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.getAll(SESSION_HISTORY_STORE);
  return rows
    .map((item) => workoutSessionSchema.safeParse(item))
    .filter((r) => r.success)
    .map((r) => r.data);
}

export async function appendToSessionHistory(session: WorkoutSession): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.put(SESSION_HISTORY_STORE, session, session.id);
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
