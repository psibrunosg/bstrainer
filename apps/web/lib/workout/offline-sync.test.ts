import "fake-indexeddb/auto";
import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  createFreeSession,
  loadActiveSession,
  saveActiveSession,
  clearActiveSession,
  loadSyncQueue,
  enqueueSyncSession,
  dequeueSyncSession,
  resetDbPromiseForTest,
  SYNC_QUEUE_STORE,
} from "./storage";
import { drainPending, syncSession } from "./sync";
import type { WorkoutSession, PerformedExercise } from "@bstrainer/domain";

describe("Offline-First Storage and Idempotent Sync Queue", () => {
  beforeEach(async () => {
    resetDbPromiseForTest();
    await clearActiveSession();
    const queue = await loadSyncQueue();
    for (const item of queue) {
      await dequeueSyncSession(item.id);
    }
  });

  it("manutenção da sessão ativa com reload offline e zero perda de séries", async () => {
    const session = createFreeSession();
    const exercise: PerformedExercise & { kind: "exercise" } = {
      kind: "exercise",
      id: "00000000-0000-4000-8000-000000000100",
      exerciseId: "00000000-0000-4000-8000-000000000200",
      prescribedExerciseId: null,
      order: 1,
      wasSubstituted: false,
      sets: [
        {
          id: "00000000-0000-4000-8000-000000000301",
          order: 1,
          reps: 10,
          loadKg: 80,
          rpe: 8,
          rir: null,
          isFailure: false,
          isWarmup: false,
          timeSeconds: null,
          notes: null,
        },
        {
          id: "00000000-0000-4000-8000-000000000302",
          order: 2,
          reps: 8,
          loadKg: 85,
          rpe: 9,
          rir: null,
          isFailure: false,
          isWarmup: false,
          timeSeconds: null,
          notes: null,
        },
      ],
    };
    session.blocks.push(exercise);

    // Persiste instantaneamente na confirmação das séries no IndexedDB
    await saveActiveSession(session);

    // Simula reload da página / desconectado no DevTools (resetando promise na memória)
    resetDbPromiseForTest();

    const loaded = await loadActiveSession();
    expect(loaded).toBeDefined();
    expect(loaded?.id).toBe(session.id);
    expect(loaded?.blocks).toHaveLength(1);

    const loadedEx = loaded?.blocks[0];
    expect(loadedEx?.kind).toBe("exercise");
    if (loadedEx?.kind === "exercise") {
      expect(loadedEx.sets).toHaveLength(2);
      expect(loadedEx.sets[0]?.reps).toBe(10);
      expect(loadedEx.sets[1]?.loadKg).toBe(85);
    }
  });

  it("fila de reenvio em segundo plano preserva sessão em falha de conexão", async () => {
    const session = createFreeSession();
    session.status = "completed";
    session.finishedAt = new Date().toISOString();

    // Enfileira manualmente no IndexedDB (simulando falha de syncSession por falta de rede)
    await enqueueSyncSession(session);

    const queue = await loadSyncQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]?.id).toBe(session.id);
  });

  it("ausência de duplicados e idempotência garantida na fila de sync", async () => {
    const session = createFreeSession();
    session.status = "completed";
    session.finishedAt = new Date().toISOString();

    await enqueueSyncSession(session);
    await enqueueSyncSession(session); // Segunda tentativa idêntica (upsert no IndexedDB)

    const queue = await loadSyncQueue();
    expect(queue).toHaveLength(1); // Garante que não há duplicidade de registros na fila idb
  });
});
