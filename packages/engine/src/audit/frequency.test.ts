import { describe, expect, it } from "vitest";
import { weeklyStreak, frequencyHeatmap } from "./frequency";
import type { WorkoutSession } from "@bstrainer/domain";
import { randomUUID } from "crypto";

/**
 * Helper to create a minimal valid WorkoutSession for testing
 */
function mkSession(
  startedAtISO: string,
  status: string = "completed"
): WorkoutSession {
  return {
    id: randomUUID(),
    clientId: randomUUID(),
    workoutTemplateId: randomUUID(),
    startedAt: startedAtISO,
    finishedAt: startedAtISO,
    status: status as any,
    sessionRpe: null,
    readiness: null,
    notes: null,
    blocks: [],
  };
}

describe("weeklyStreak", () => {
  it("returns 0 when no sessions", () => {
    const today = new Date("2026-07-13T12:00:00Z");
    expect(weeklyStreak([], today)).toBe(0);
  });

  it("counts consecutive weeks backward from today", () => {
    const today = new Date("2026-07-13T12:00:00Z"); // Sunday, mondayOf returns 2026-07-06
    // Three consecutive weeks of training
    const week1 = mkSession("2026-07-10T10:00:00Z"); // Friday in week of 2026-07-06
    const week2 = mkSession("2026-07-02T10:00:00Z"); // Wednesday in week of 2026-06-29
    const week3 = mkSession("2026-06-25T10:00:00Z"); // Thursday in week of 2026-06-22

    expect(weeklyStreak([week1, week2, week3], today)).toBe(3);
  });

  it("does not zero streak if current week has no training", () => {
    const today = new Date("2026-07-13T12:00:00Z"); // Monday, week 2026-07-13
    // No training in current week (2026-07-13)
    // Training in previous week (2026-07-06)
    const prevWeek = mkSession("2026-07-08T10:00:00Z"); // Wednesday in week 2026-07-06

    expect(weeklyStreak([prevWeek], today)).toBe(1);
  });

  it("breaks streak on a gap of one week", () => {
    const today = new Date("2026-07-13T12:00:00Z");
    // Week starting 2026-07-06
    const week1 = mkSession("2026-07-10T10:00:00Z");
    // Week starting 2026-06-15 (gap: no training in 2026-06-29)
    const week3 = mkSession("2026-06-20T10:00:00Z");

    expect(weeklyStreak([week1, week3], today)).toBe(1);
  });

  it("ignores non-completed sessions", () => {
    const today = new Date("2026-07-13T12:00:00Z");
    const completed = mkSession("2026-07-10T10:00:00Z", "completed");
    const skipped = mkSession("2026-07-02T10:00:00Z", "skipped");
    const partial = mkSession("2026-06-25T10:00:00Z", "partial");

    // Only completed should count
    expect(weeklyStreak([completed, skipped, partial], today)).toBe(1);
  });

  it("handles multiple trainings in same week (counts only once per week)", () => {
    const today = new Date("2026-07-13T12:00:00Z");
    const session1 = mkSession("2026-07-10T10:00:00Z"); // Friday week 2026-07-06
    const session2 = mkSession("2026-07-08T14:00:00Z"); // Wednesday week 2026-07-06
    const session3 = mkSession("2026-07-02T09:00:00Z"); // Wednesday week 2026-06-29

    expect(weeklyStreak([session1, session2, session3], today)).toBe(2);
  });
});

describe("frequencyHeatmap", () => {
  it("returns exactly `days` cells", () => {
    const today = new Date("2026-07-13T12:00:00Z");
    const heatmap = frequencyHeatmap([], 91, today);
    expect(heatmap).toHaveLength(91);
  });

  it("returns exactly `days` cells with custom days param", () => {
    const today = new Date("2026-07-13T12:00:00Z");
    const heatmap30 = frequencyHeatmap([], 30, today);
    expect(heatmap30).toHaveLength(30);

    const heatmap365 = frequencyHeatmap([], 365, today);
    expect(heatmap365).toHaveLength(365);
  });

  it("counts workouts on the correct day", () => {
    const today = new Date("2026-07-13T12:00:00Z");
    const session1 = mkSession("2026-07-10T10:00:00Z");
    const session2 = mkSession("2026-07-10T14:00:00Z");
    const session3 = mkSession("2026-07-11T09:00:00Z");

    const heatmap = frequencyHeatmap([session1, session2, session3], 15, today);

    const cell10 = heatmap.find((c) => c.date === "2026-07-10");
    const cell11 = heatmap.find((c) => c.date === "2026-07-11");

    expect(cell10?.count).toBe(2);
    expect(cell11?.count).toBe(1);
  });

  it("marks days with no workouts as count 0", () => {
    const today = new Date("2026-07-13T12:00:00Z");
    const heatmap = frequencyHeatmap([], 5, today);

    heatmap.forEach((cell) => {
      expect(cell.count).toBe(0);
    });
  });

  it("ignores sessions with status != 'completed'", () => {
    const today = new Date("2026-07-13T12:00:00Z");
    const completed = mkSession("2026-07-10T10:00:00Z", "completed");
    const skipped = mkSession("2026-07-10T14:00:00Z", "skipped");
    const partial = mkSession("2026-07-10T15:00:00Z", "partial");

    const heatmap = frequencyHeatmap([completed, skipped, partial], 15, today);

    const cell10 = heatmap.find((c) => c.date === "2026-07-10");
    expect(cell10?.count).toBe(1);
  });

  it("includes cells going backward from today", () => {
    const today = new Date("2026-07-13T12:00:00Z");
    const heatmap = frequencyHeatmap([], 3, today);

    // Should include 3 most recent days: 2026-07-13, 2026-07-12, 2026-07-11
    expect(heatmap[0]?.date).toBe("2026-07-11");
    expect(heatmap[1]?.date).toBe("2026-07-12");
    expect(heatmap[2]?.date).toBe("2026-07-13");
  });

  it("counts multiple trainings on same day correctly", () => {
    const today = new Date("2026-07-13T12:00:00Z");
    const s1 = mkSession("2026-07-12T08:00:00Z");
    const s2 = mkSession("2026-07-12T16:00:00Z");
    const s3 = mkSession("2026-07-12T19:00:00Z");

    const heatmap = frequencyHeatmap([s1, s2, s3], 5, today);
    const cell12 = heatmap.find((c) => c.date === "2026-07-12");

    expect(cell12?.count).toBe(3);
  });

  it("uses default days=91 when not specified", () => {
    const today = new Date("2026-07-13T12:00:00Z");
    const heatmap = frequencyHeatmap([], undefined, today);

    expect(heatmap).toHaveLength(91);
  });
});
