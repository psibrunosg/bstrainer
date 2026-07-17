import { describe, expect, it } from "vitest";
import type { PerformedSet, WorkoutSession } from "@bstrainer/domain";
import { buildBadgeContext, evaluateBadges } from "./badges";

function setRow(overrides: Partial<PerformedSet> = {}): PerformedSet {
  return {
    id: "s",
    order: 1,
    reps: 5,
    loadKg: 100,
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
    exercises: sets.length
      ? [
          {
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

describe("buildBadgeContext", () => {
  it("counts only completed sessions", () => {
    const ctx = buildBadgeContext(
      [session([setRow()]), session([setRow()], { status: "in_progress" })],
      0,
    );
    expect(ctx.completedCount).toBe(1);
  });

  it("sums non-warmup sets and tracks max session tonnage", () => {
    const heavy = session([
      setRow({ reps: 5, loadKg: 100 }),
      setRow({ isWarmup: true }),
    ]);
    const ctx = buildBadgeContext([heavy], 0);
    expect(ctx.totalSets).toBe(1);
    expect(ctx.maxSessionTonnageKg).toBe(500);
  });

  it("passes weeklyStreak through unchanged", () => {
    const ctx = buildBadgeContext([], 7);
    expect(ctx.weeklyStreak).toBe(7);
  });
});

describe("evaluateBadges", () => {
  it("earns nothing below every threshold", () => {
    const badges = evaluateBadges({
      completedCount: 0,
      weeklyStreak: 0,
      maxSessionTonnageKg: 0,
      totalSets: 0,
    });
    expect(badges.every((b) => !b.earned)).toBe(true);
  });

  it("earns first_workout at 1 completed session, not ten_workouts", () => {
    const badges = evaluateBadges({
      completedCount: 1,
      weeklyStreak: 0,
      maxSessionTonnageKg: 0,
      totalSets: 0,
    });
    expect(badges.find((b) => b.key === "first_workout")?.earned).toBe(true);
    expect(badges.find((b) => b.key === "ten_workouts")?.earned).toBe(false);
  });

  it("earns streak badges at their thresholds", () => {
    const badges = evaluateBadges({
      completedCount: 0,
      weeklyStreak: 4,
      maxSessionTonnageKg: 0,
      totalSets: 0,
    });
    expect(badges.find((b) => b.key === "streak_4")?.earned).toBe(true);
    expect(badges.find((b) => b.key === "streak_12")?.earned).toBe(false);
  });

  it("earns heavy_session and century_sets at their thresholds", () => {
    const badges = evaluateBadges({
      completedCount: 0,
      weeklyStreak: 0,
      maxSessionTonnageKg: 5000,
      totalSets: 100,
    });
    expect(badges.find((b) => b.key === "heavy_session")?.earned).toBe(true);
    expect(badges.find((b) => b.key === "century_sets")?.earned).toBe(true);
  });
});
