import { describe, expect, it } from "vitest";
import { buildSetRows } from "./set-rows";
import type { PerformedSet } from "@bstrainer/domain";

function set(reps: number, loadKg: number | null): PerformedSet {
  return {
    id: crypto.randomUUID(),
    order: 1,
    reps,
    loadKg,
    rpe: null,
    rir: null,
    isFailure: false,
    isWarmup: false,
    timeSeconds: null,
    notes: null,
  };
}

describe("buildSetRows", () => {
  it("marks rows before the confirmed count as confirmed, the next one as active, the rest as preview", () => {
    const rows = buildSetRows({
      confirmedSets: [set(10, 30), set(8, 32.5)],
      rowCount: 4,
      targetAt: () => undefined,
      anteriorAt: () => undefined,
      draftAt: () => ({ reps: 8, load: "", rpe: "" }),
    });

    expect(rows.map((r) => r.state)).toEqual(["confirmed", "confirmed", "active", "preview"]);
    expect(rows.map((r) => r.index)).toEqual([0, 1, 2, 3]);
    expect(rows[0]?.confirmedSet?.reps).toBe(10);
    expect(rows[1]?.confirmedSet?.reps).toBe(8);
    expect(rows[2]?.draft).toEqual({ reps: 8, load: "", rpe: "" });
  });

  it("always includes an active row even when rowCount is behind the confirmed count", () => {
    const rows = buildSetRows({
      confirmedSets: [set(10, 30), set(8, 32.5), set(6, 35)],
      rowCount: 1,
      targetAt: () => undefined,
      anteriorAt: () => undefined,
      draftAt: () => ({ reps: 8, load: "", rpe: "" }),
    });

    expect(rows.map((r) => r.state)).toEqual(["confirmed", "confirmed", "confirmed", "active"]);
    expect(rows).toHaveLength(4);
  });

  it("with zero confirmed sets and rowCount 1, produces a single active row", () => {
    const rows = buildSetRows({
      confirmedSets: [],
      rowCount: 1,
      targetAt: () => undefined,
      anteriorAt: () => undefined,
      draftAt: () => ({ reps: 8, load: "", rpe: "" }),
    });

    expect(rows.map((r) => r.state)).toEqual(["active"]);
  });
});
