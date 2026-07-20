import { describe, expect, it } from "vitest";
import type { PerformedSet, WorkoutSession } from "@bstrainer/domain";
import { computeXp } from "./xp";

function setRow(overrides: Partial<PerformedSet> = {}): PerformedSet {
  return {
    id: "s",
    order: 1,
    reps: 1,
    loadKg: 0,
    rpe: null,
    rir: null,
    isFailure: false,
    isWarmup: false,
    timeSeconds: null,
    notes: null,
    ...overrides,
  };
}

function session(
  sets: PerformedSet[],
  overrides: Partial<WorkoutSession> = {},
): WorkoutSession {
  return {
    id: "sess",
    clientId: "c1",
    workoutTemplateId: null,
    startedAt: "2026-01-01T00:00:00.000Z",
    finishedAt: "2026-01-01T01:00:00.000Z",
    status: "completed",
    sessionRpe: null,
    readiness: null,
    notes: null,
    blocks: sets.length
      ? [
          {
            kind: "exercise" as const,
            id: "e1",
            exerciseId: "ex1",
            prescribedExerciseId: null,
            order: 1,
            wasSubstituted: false,
            sets,
          },
        ]
      : [],
    ...overrides,
  };
}

describe("computeXp", () => {
  it("returns 0 xp and level 1 for no sessions", () => {
    const result = computeXp([]);
    expect(result.xp).toBe(0);
    expect(result.level).toBe(1);
    expect(result.xpIntoLevel).toBe(0);
    expect(result.xpForNextLevel).toBe(100);
  });

  it("ignores non-completed sessions", () => {
    const result = computeXp([session([setRow()], { status: "in_progress" })]);
    expect(result.xp).toBe(0);
  });

  it("counts base xp and per-set xp, excluding warmup sets", () => {
    const s = session([setRow(), setRow({ isWarmup: true })]);
    // 10 base + 2 x 1 valid set (warmup excluded) + 0 tonnage
    const result = computeXp([s]);
    expect(result.xp).toBe(12);
  });

  it("flips to level 2 exactly at 100xp", () => {
    const fortyFiveSets = Array.from({ length: 45 }, () => setRow());
    const s = session(fortyFiveSets);
    // 10 base + 2*45 = 100
    const result = computeXp([s]);
    expect(result.xp).toBe(100);
    expect(result.level).toBe(2);
    expect(result.xpIntoLevel).toBe(0);
    expect(result.xpForNextLevel).toBe(300);
  });

  it("stays at level 1 just below the boundary", () => {
    const fortyFourSets = Array.from({ length: 44 }, () => setRow());
    const result = computeXp([session(fortyFourSets)]);
    expect(result.xp).toBe(98);
    expect(result.level).toBe(1);
  });
});
