import type { TrainingPlan, WorkoutBlock } from "@bstrainer/domain";

export interface CreatePlanDraftPayload {
  orgId: string;
  clientId: string;
  goal: string;
  engine: "template" | "assisted";
  startDate: string;
  endDate: string | null;
  sourceTemplateId: string | null;
  mesocycles: Array<{
    id: string;
    position: number;
    weeks: number;
    emphasis: string;
    progressionModel: string;
    includesDeload: boolean;
    notes: string | null;
    workouts: Array<{
      id: string;
      name: string;
      suggestedWeekday: number | null;
      position: number;
      blocks: Array<Record<string, unknown>>;
    }>;
  }>;
}

export function toCreatePlanDraftPayload(input: {
  orgId: string;
  clientId: string;
  engine: "template" | "assisted";
  startDate: string;
  sourceTemplateId: string | null;
  plan: TrainingPlan;
}): CreatePlanDraftPayload {
  return {
    orgId: input.orgId,
    clientId: input.clientId,
    goal: input.plan.goal,
    engine: input.engine,
    startDate: input.startDate,
    endDate: input.plan.endDate,
    sourceTemplateId: input.sourceTemplateId,
    mesocycles: [...input.plan.mesocycles]
      .sort((left, right) => left.order - right.order)
      .map((mesocycle) => ({
        id: mesocycle.id,
        position: mesocycle.order,
        weeks: mesocycle.weeks,
        emphasis: mesocycle.emphasis,
        progressionModel: mesocycle.progressionModel,
        includesDeload: mesocycle.includesDeload,
        notes: mesocycle.notes,
        workouts: [...mesocycle.workouts]
          .sort((left, right) => left.order - right.order)
          .map((workout) => ({
            id: workout.id,
            name: workout.name,
            suggestedWeekday: workout.suggestedWeekday,
            position: workout.order,
            blocks: [...workout.blocks]
              .sort((left, right) => left.order - right.order)
              .map(toPayloadBlock),
          })),
      })),
  };
}

function toPayloadBlock(block: WorkoutBlock): Record<string, unknown> {
  if (block.kind === "exercise") {
    return {
      kind: block.kind,
      id: block.id,
      exerciseId: block.exerciseId,
      position: block.order,
      technique: block.technique,
      supersetGroup: block.supersetGroup,
      notes: block.notes,
      sets: [...block.sets]
        .sort((left, right) => left.order - right.order)
        .map((set) => ({
          id: set.id,
          position: set.order,
          repsMin: set.repsMin,
          repsMax: set.repsMax,
          loadMethod: set.loadMethod,
          loadValue: set.loadValue,
          targetRpe: set.targetRpe,
          targetRir: set.targetRir,
          restSeconds: set.restSeconds,
          isWarmup: set.isWarmup,
          isAmrap: set.isAmrap,
        })),
    };
  }

  if (block.kind === "activity") {
    return {
      kind: block.kind,
      id: block.id,
      activityId: block.activityId,
      position: block.order,
      durationSeconds: block.durationSeconds,
      distanceKm: block.distanceKm,
      targetPaceMinPerKm: block.targetPaceMinPerKm,
      targetRpe: block.targetRpe,
      notes: block.notes,
    };
  }

  return {
    kind: block.kind,
    id: block.id,
    position: block.order,
    exerciseIds: block.exerciseIds,
    rounds: block.rounds,
    workSeconds: block.workSeconds,
    restSeconds: block.restSeconds,
    targetRpe: block.targetRpe,
    notes: block.notes,
  };
}
