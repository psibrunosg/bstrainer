import { describe, expect, it, vi } from "vitest";
import type { WorkoutSession } from "@bstrainer/domain";

const EXERCISE_A = "11111111-1111-4111-8111-111111111111";
const EXERCISE_B = "22222222-2222-4222-8222-222222222222";

function session(overrides: Partial<WorkoutSession> & { startedAt: string }): WorkoutSession {
  return {
    id: crypto.randomUUID(),
    clientId: "00000000-0000-4000-8000-000000000001",
    workoutTemplateId: null,
    finishedAt: null,
    status: "completed",
    sessionRpe: null,
    readiness: null,
    notes: null,
    blocks: [],
    ...overrides,
  };
}

vi.mock("./storage", () => ({
  loadSessionHistory: vi.fn(),
}));

describe("lastSessionSetsFor", () => {
  it("returns the ordered work sets (no warmups) from the most recent completed session with that exercise", async () => {
    const { loadSessionHistory } = await import("./storage");
    vi.mocked(loadSessionHistory).mockResolvedValue([
      session({
        startedAt: "2026-07-20T10:00:00.000Z",
        blocks: [
          {
            kind: "exercise",
            id: crypto.randomUUID(),
            exerciseId: EXERCISE_A,
            prescribedExerciseId: null,
            order: 1,
            wasSubstituted: false,
            sets: [
              { id: crypto.randomUUID(), order: 1, reps: 12, loadKg: 20, rpe: null, rir: null, isFailure: false, isWarmup: true, timeSeconds: null, notes: null },
              { id: crypto.randomUUID(), order: 2, reps: 10, loadKg: 30, rpe: 8, rir: null, isFailure: false, isWarmup: false, timeSeconds: null, notes: null },
              { id: crypto.randomUUID(), order: 3, reps: 8, loadKg: 32.5, rpe: 9, rir: null, isFailure: false, isWarmup: false, timeSeconds: null, notes: null },
            ],
          },
        ],
      }),
    ]);

    const { lastSessionSetsFor } = await import("./history-lookup");
    const result = await lastSessionSetsFor(EXERCISE_A);

    expect(result).toEqual([
      { loadKg: 30, reps: 10, date: "2026-07-20T10:00:00.000Z" },
      { loadKg: 32.5, reps: 8, date: "2026-07-20T10:00:00.000Z" },
    ]);
  });

  it("returns null when no completed session contains the exercise", async () => {
    const { loadSessionHistory } = await import("./storage");
    vi.mocked(loadSessionHistory).mockResolvedValue([
      session({ startedAt: "2026-07-20T10:00:00.000Z", blocks: [] }),
    ]);

    const { lastSessionSetsFor } = await import("./history-lookup");
    const result = await lastSessionSetsFor(EXERCISE_B);

    expect(result).toBeNull();
  });
});
