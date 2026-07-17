import { describe, expect, it } from "vitest";
import { computeStrengthScore, KEY_LIFT_IDS } from "./strength-score";

describe("computeStrengthScore", () => {
  it("returns null overall when bodyweight is missing", () => {
    const result = computeStrengthScore({ [KEY_LIFT_IDS.squat]: 100 }, null);
    expect(result.overall).toBeNull();
    expect(result.lifts).toEqual([]);
  });

  it("returns null overall when bodyweight is zero or negative", () => {
    expect(computeStrengthScore({}, 0).overall).toBeNull();
    expect(computeStrengthScore({}, -10).overall).toBeNull();
  });

  it("scores a single known lift against its bodyweight ratio", () => {
    // squat ratio 1.5x — e1RM exactly at ratio scores 100
    const result = computeStrengthScore({ [KEY_LIFT_IDS.squat]: 150 }, 100);
    expect(result.lifts).toHaveLength(1);
    expect(result.lifts[0]!.key).toBe("squat");
    expect(result.lifts[0]!.score).toBe(100);
    expect(result.overall).toBe(100);
  });

  it("skips lifts with no e1RM data instead of scoring them zero", () => {
    const result = computeStrengthScore({ [KEY_LIFT_IDS.bench]: 80 }, 80);
    expect(result.lifts).toHaveLength(1);
    expect(result.lifts[0]!.key).toBe("bench");
    expect(result.overall).toBe(100);
  });

  it("caps an individual lift score at 200", () => {
    const result = computeStrengthScore(
      { [KEY_LIFT_IDS.overheadPress]: 1000 },
      50,
    );
    expect(result.lifts[0]!.score).toBe(200);
  });

  it("averages multiple scored lifts", () => {
    const result = computeStrengthScore(
      {
        [KEY_LIFT_IDS.squat]: 150, // 100/100 ratio -> 100
        [KEY_LIFT_IDS.bench]: 40, // 40/100 ratio -> 40
      },
      100,
    );
    expect(result.overall).toBe(70);
  });
});
