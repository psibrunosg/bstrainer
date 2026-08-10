import type { TrainingPlan } from "@bstrainer/domain";
import { describe, expect, it } from "vitest";
import { toCreatePlanDraftPayload } from "./plan-draft-payload";

const id = (suffix: string) => `00000000-0000-4000-8000-${suffix}`;

const input: {
  orgId: string;
  clientId: string;
  engine: "template" | "assisted";
  startDate: string;
  sourceTemplateId: string | null;
  plan: TrainingPlan;
} = {
  orgId: id("000000000101"),
  clientId: id("000000000102"),
  engine: "assisted",
  startDate: "2026-08-10",
  sourceTemplateId: id("000000000103"),
  plan: {
    id: id("000000000001"),
    orgId: id("000000000002"),
    clientId: id("000000000003"),
    createdBy: id("000000000004"),
    goal: "hypertrophy",
    engine: "ai",
    status: "active",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    mesocycles: [
      {
        id: id("000000000201"),
        order: 2,
        weeks: 3,
        emphasis: "strength",
        progressionModel: "undulating",
        includesDeload: true,
        notes: "Second mesocycle",
        workouts: [
          {
            id: id("000000000301"),
            name: "Treino B",
            suggestedWeekday: 3,
            order: 1,
            blocks: [],
          },
        ],
      },
      {
        id: id("000000000202"),
        order: 1,
        weeks: 4,
        emphasis: "hypertrophy",
        progressionModel: "double_progression",
        includesDeload: false,
        notes: null,
        workouts: [
          {
            id: id("000000000302"),
            name: "Treino B",
            suggestedWeekday: null,
            order: 2,
            blocks: [],
          },
          {
            id: id("000000000303"),
            name: "Treino A",
            suggestedWeekday: 1,
            order: 1,
            blocks: [
              {
                kind: "activity",
                id: id("000000000401"),
                activityId: id("000000000501"),
                order: 2,
                durationSeconds: 1800,
                distanceKm: 5,
                targetPaceMinPerKm: 6,
                targetRpe: 6,
                notes: "Z2",
              },
              {
                kind: "circuit",
                id: id("000000000402"),
                order: 3,
                exerciseIds: [id("000000000503"), id("000000000502")],
                rounds: 4,
                workSeconds: 45,
                restSeconds: 15,
                targetRpe: 8,
                notes: "Finisher",
              },
              {
                kind: "exercise",
                id: id("000000000403"),
                exerciseId: id("000000000504"),
                order: 1,
                technique: "superset",
                supersetGroup: 2,
                notes: "Controlled tempo",
                sets: [
                  {
                    id: id("000000000602"),
                    order: 2,
                    repsMin: 10,
                    repsMax: 12,
                    loadMethod: "rpe",
                    loadValue: null,
                    targetRpe: 8.5,
                    targetRir: 1,
                    restSeconds: 75,
                    isWarmup: false,
                    isAmrap: true,
                  },
                  {
                    id: id("000000000601"),
                    order: 1,
                    repsMin: 8,
                    repsMax: 10,
                    loadMethod: "percent_1rm",
                    loadValue: 75,
                    targetRpe: null,
                    targetRir: 2,
                    restSeconds: 90,
                    isWarmup: true,
                    isAmrap: false,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

describe("toCreatePlanDraftPayload", () => {
  it("preserves globally ordered mixed blocks", () => {
    const payload = toCreatePlanDraftPayload(input);

    expect(payload).toEqual({
      orgId: id("000000000101"),
      clientId: id("000000000102"),
      goal: "hypertrophy",
      engine: "assisted",
      startDate: "2026-08-10",
      endDate: "2026-12-31",
      sourceTemplateId: id("000000000103"),
      mesocycles: [
        {
          id: id("000000000202"),
          position: 1,
          weeks: 4,
          emphasis: "hypertrophy",
          progressionModel: "double_progression",
          includesDeload: false,
          notes: null,
          workouts: [
            {
              id: id("000000000303"),
              name: "Treino A",
              suggestedWeekday: 1,
              position: 1,
              blocks: [
                {
                  kind: "exercise",
                  id: id("000000000403"),
                  exerciseId: id("000000000504"),
                  position: 1,
                  technique: "superset",
                  supersetGroup: 2,
                  notes: "Controlled tempo",
                  sets: [
                    {
                      id: id("000000000601"),
                      position: 1,
                      repsMin: 8,
                      repsMax: 10,
                      loadMethod: "percent_1rm",
                      loadValue: 75,
                      targetRpe: null,
                      targetRir: 2,
                      restSeconds: 90,
                      isWarmup: true,
                      isAmrap: false,
                    },
                    {
                      id: id("000000000602"),
                      position: 2,
                      repsMin: 10,
                      repsMax: 12,
                      loadMethod: "rpe",
                      loadValue: null,
                      targetRpe: 8.5,
                      targetRir: 1,
                      restSeconds: 75,
                      isWarmup: false,
                      isAmrap: true,
                    },
                  ],
                },
                {
                  kind: "activity",
                  id: id("000000000401"),
                  activityId: id("000000000501"),
                  position: 2,
                  durationSeconds: 1800,
                  distanceKm: 5,
                  targetPaceMinPerKm: 6,
                  targetRpe: 6,
                  notes: "Z2",
                },
                {
                  kind: "circuit",
                  id: id("000000000402"),
                  position: 3,
                  exerciseIds: [id("000000000503"), id("000000000502")],
                  rounds: 4,
                  workSeconds: 45,
                  restSeconds: 15,
                  targetRpe: 8,
                  notes: "Finisher",
                },
              ],
            },
            {
              id: id("000000000302"),
              name: "Treino B",
              suggestedWeekday: null,
              position: 2,
              blocks: [],
            },
          ],
        },
        {
          id: id("000000000201"),
          position: 2,
          weeks: 3,
          emphasis: "strength",
          progressionModel: "undulating",
          includesDeload: true,
          notes: "Second mesocycle",
          workouts: [
            {
              id: id("000000000301"),
              name: "Treino B",
              suggestedWeekday: 3,
              position: 1,
              blocks: [],
            },
          ],
        },
      ],
    });
  });

  it("does not expose creator or status fields", () => {
    const payload = toCreatePlanDraftPayload(input);

    expect(payload).not.toHaveProperty("id");
    expect(payload).not.toHaveProperty("createdBy");
    expect(payload).not.toHaveProperty("status");
  });
});
