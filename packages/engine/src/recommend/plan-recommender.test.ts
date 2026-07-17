import { describe, expect, it } from "vitest";
import { randomUUID } from "crypto";
import type { AthleteProfile } from "@bstrainer/domain";
import type { PlanTemplateSpec } from "../templates/types";
import { recommendTemplate } from "./plan-recommender";

function mkProfile(overrides: Partial<AthleteProfile> = {}): AthleteProfile {
  const now = new Date().toISOString();
  return {
    profileId: randomUUID(),
    sex: null,
    birthDate: null,
    weightKg: null,
    heightCm: null,
    level: "intermediate",
    goal: "hypertrophy",
    trainingLocation: "gym",
    daysPerWeek: 4,
    equipment: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function mkTemplate(overrides: Partial<PlanTemplateSpec> = {}): PlanTemplateSpec {
  return {
    id: overrides.id ?? randomUUID(),
    name: "Template",
    goal: "hypertrophy",
    level: "intermediate",
    daysPerWeek: 4,
    rationale: "rationale",
    progressionRule: "linear",
    mesocycles: [
      {
        weeks: 4,
        emphasis: "hypertrophy",
        progressionModel: "linear",
        includesDeload: false,
        workouts: [
          {
            name: "Day 1",
            suggestedWeekday: 1,
            exercises: [
              {
                slot: "squat",
                suggestedVariant: "back squat",
                priorityEquipment: "barbell",
                setScheme: {
                  setCount: 3,
                  repsMin: 8,
                  repsMax: 12,
                  loadMethod: "rpe",
                  restSeconds: 90,
                  lastSetAmrap: false,
                },
              },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("recommendTemplate", () => {
  it("returns null for empty template list", () => {
    expect(recommendTemplate(mkProfile(), [])).toBeNull();
  });

  it("picks matching goal over matching level when they conflict", () => {
    const profile = mkProfile({ goal: "strength", level: "intermediate", daysPerWeek: 4 });
    const goalMatch = mkTemplate({
      id: "goal-match",
      goal: "strength",
      level: "beginner",
      daysPerWeek: 4,
    });
    const levelMatch = mkTemplate({
      id: "level-match",
      goal: "hypertrophy",
      level: "intermediate",
      daysPerWeek: 4,
    });

    const result = recommendTemplate(profile, [levelMatch, goalMatch]);

    expect(result?.template.id).toBe("goal-match");
  });

  it("respects daysPerWeek closeness among otherwise equal templates", () => {
    const profile = mkProfile({ goal: "hypertrophy", level: "intermediate", daysPerWeek: 3 });
    const closeDays = mkTemplate({
      id: "close-days",
      goal: "hypertrophy",
      level: "intermediate",
      daysPerWeek: 3,
    });
    const farDays = mkTemplate({
      id: "far-days",
      goal: "hypertrophy",
      level: "intermediate",
      daysPerWeek: 6,
    });

    const result = recommendTemplate(profile, [farDays, closeDays]);

    expect(result?.template.id).toBe("close-days");
    expect(result?.reasons).toContain("Frequência ideal: 3x/semana");
  });
});
