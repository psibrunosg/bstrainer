import { describe, expect, it } from "vitest";
import { suggestAdjustment } from "./autoregulation";

describe("suggestAdjustment", () => {
  it("recommends deload on low readiness", () => {
    const result = suggestAdjustment({
      readiness: { sleep: 1, soreness: 2, energy: null },
      lastSessionRpe: null,
      recentE1rmTrend: null,
    });

    expect(result.recommendation).toBe("deload");
    expect(result.loadMultiplier).toBe(0.6);
  });

  it("recommends deload on high fatigue + declining strength", () => {
    const result = suggestAdjustment({
      readiness: null,
      lastSessionRpe: 9.5,
      recentE1rmTrend: "down",
    });

    expect(result.recommendation).toBe("deload");
    expect(result.loadMultiplier).toBe(0.8);
  });

  it("recommends progress on rising trend with manageable effort", () => {
    const result = suggestAdjustment({
      readiness: null,
      lastSessionRpe: 7,
      recentE1rmTrend: "up",
    });

    expect(result.recommendation).toBe("progress");
    expect(result.loadMultiplier).toBe(1.05);
  });

  it("recommends maintain when there is no clear signal", () => {
    const result = suggestAdjustment({
      readiness: null,
      lastSessionRpe: null,
      recentE1rmTrend: "flat",
    });

    expect(result.recommendation).toBe("maintain");
    expect(result.loadMultiplier).toBe(1.0);
  });

  it("prioritizes low readiness deload over an upward trend", () => {
    const result = suggestAdjustment({
      readiness: { sleep: 1, soreness: 1, energy: 1 },
      lastSessionRpe: 5,
      recentE1rmTrend: "up",
    });

    expect(result.recommendation).toBe("deload");
    expect(result.loadMultiplier).toBe(0.6);
  });

  it("does not deload on readiness with fewer than 2 non-null fields", () => {
    const result = suggestAdjustment({
      readiness: { sleep: 1, soreness: null, energy: null },
      lastSessionRpe: null,
      recentE1rmTrend: null,
    });

    expect(result.recommendation).toBe("maintain");
  });
});
