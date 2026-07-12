import { describe, expect, it } from "vitest";
import {
  e1rmBrzycki,
  e1rmEpley,
  e1rmWithRir,
  loadFromPercent,
  roundToPlate,
} from "./e1rm";

describe("e1rmEpley", () => {
  it("returns load itself for 1 rep", () => {
    expect(e1rmEpley(100, 1)).toBe(100);
  });
  it("estimates 100kg x 5 reps ~ 116.7kg", () => {
    expect(e1rmEpley(100, 5)).toBeCloseTo(116.67, 1);
  });
  it("returns 0 for invalid input", () => {
    expect(e1rmEpley(0, 5)).toBe(0);
    expect(e1rmEpley(100, 0)).toBe(0);
  });
});

describe("e1rmBrzycki", () => {
  it("returns load itself for 1 rep", () => {
    expect(e1rmBrzycki(100, 1)).toBe(100);
  });
  it("estimates 100kg x 5 reps ~ 112.5kg", () => {
    expect(e1rmBrzycki(100, 5)).toBeCloseTo(112.5, 1);
  });
  it("returns 0 at or above 37 reps (formula domain)", () => {
    expect(e1rmBrzycki(100, 37)).toBe(0);
  });
});

describe("e1rmWithRir", () => {
  it("adds RIR to reps before estimating", () => {
    expect(e1rmWithRir(100, 5, 2)).toBeCloseTo(e1rmEpley(100, 7), 5);
  });
  it("ignores negative RIR", () => {
    expect(e1rmWithRir(100, 5, -1)).toBeCloseTo(e1rmEpley(100, 5), 5);
  });
});

describe("roundToPlate", () => {
  it("rounds to nearest 2.5kg by default", () => {
    expect(roundToPlate(101.3)).toBe(102.5);
    expect(roundToPlate(101.1)).toBe(100);
  });
  it("supports custom increments", () => {
    expect(roundToPlate(101.3, 5)).toBe(100);
  });
});

describe("loadFromPercent", () => {
  it("converts %1RM to plate-rounded load", () => {
    expect(loadFromPercent(140, 75)).toBe(105);
    expect(loadFromPercent(100, 72.5)).toBe(72.5);
  });
});
