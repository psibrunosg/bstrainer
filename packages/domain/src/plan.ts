import { z } from "zod";

export const trainingGoalSchema = z.enum([
  "hypertrophy",
  "strength",
  "power",
  "endurance",
  "health",
  "fat_loss",
]);
export type TrainingGoal = z.infer<typeof trainingGoalSchema>;

export const planEngineSchema = z.enum(["template", "assisted", "ai"]);
export type PlanEngine = z.infer<typeof planEngineSchema>;

export const planStatusSchema = z.enum([
  "draft",
  "active",
  "completed",
  "archived",
]);
export type PlanStatus = z.infer<typeof planStatusSchema>;

export const progressionModelSchema = z.enum([
  "linear",
  "double_progression",
  "undulating",
  "step_loading",
]);
export type ProgressionModel = z.infer<typeof progressionModelSchema>;

export const loadMethodSchema = z.enum([
  "percent_1rm",
  "rpe",
  "rir",
  "absolute",
  "bodyweight",
]);
export type LoadMethod = z.infer<typeof loadMethodSchema>;

export const setTechniqueSchema = z.enum([
  "straight",
  "superset",
  "dropset",
  "rest_pause",
  "cluster",
]);
export type SetTechnique = z.infer<typeof setTechniqueSchema>;

/** Série prescrita — faixa de reps, nunca número fixo. */
export const prescribedSetSchema = z.object({
  id: z.string().uuid(),
  order: z.number().int().min(1),
  repsMin: z.number().int().min(1),
  repsMax: z.number().int().min(1),
  loadMethod: loadMethodSchema,
  loadValue: z.number().nullable(), // %1RM (0-100), kg absoluto, ou null p/ bodyweight
  targetRpe: z.number().min(1).max(10).nullable().default(null),
  targetRir: z.number().int().min(0).max(10).nullable().default(null),
  restSeconds: z.number().int().min(0).default(90),
  isWarmup: z.boolean().default(false),
  isAmrap: z.boolean().default(false),
});
export type PrescribedSet = z.infer<typeof prescribedSetSchema>;

export const prescribedExerciseSchema = z.object({
  id: z.string().uuid(),
  exerciseId: z.string().uuid(),
  order: z.number().int().min(1),
  technique: setTechniqueSchema.default("straight"),
  supersetGroup: z.number().int().nullable().default(null),
  sets: z.array(prescribedSetSchema).min(1),
  notes: z.string().nullable().default(null),
});
export type PrescribedExercise = z.infer<typeof prescribedExerciseSchema>;

/** Prescrição de esforço contínuo (corrida, bike Z2) — duração, distância e/ou pace. */
export const prescribedActivitySchema = z.object({
  id: z.string().uuid(),
  activityId: z.string().uuid(),
  order: z.number().int().min(1),
  durationSeconds: z.number().int().min(1).nullable().default(null),
  distanceKm: z.number().min(0).nullable().default(null),
  targetPaceMinPerKm: z.number().min(0).nullable().default(null),
  targetRpe: z.number().min(1).max(10).nullable().default(null),
  notes: z.string().nullable().default(null),
});
export type PrescribedActivity = z.infer<typeof prescribedActivitySchema>;

/** Prescrição de circuito por rounds (HIIT) — rounds de exercícios com work/rest fixos. */
export const prescribedCircuitSchema = z.object({
  id: z.string().uuid(),
  order: z.number().int().min(1),
  exerciseIds: z.array(z.string().uuid()).min(1),
  rounds: z.number().int().min(1),
  workSeconds: z.number().int().min(1),
  restSeconds: z.number().int().min(0),
  targetRpe: z.number().min(1).max(10).nullable().default(null),
  notes: z.string().nullable().default(null),
});
export type PrescribedCircuit = z.infer<typeof prescribedCircuitSchema>;

/** Um item da lista ordenada de um WorkoutTemplate — exercício, atividade contínua ou circuito. */
export const workoutBlockSchema = z.discriminatedUnion("kind", [
  prescribedExerciseSchema.extend({ kind: z.literal("exercise") }),
  prescribedActivitySchema.extend({ kind: z.literal("activity") }),
  prescribedCircuitSchema.extend({ kind: z.literal("circuit") }),
]);
export type WorkoutBlock = z.infer<typeof workoutBlockSchema>;

/** Narrowing helper — testes e telas que só lidam com força usam isso pra filtrar blocks. */
export function isPrescribedExercise(
  block: WorkoutBlock,
): block is PrescribedExercise & { kind: "exercise" } {
  return block.kind === "exercise";
}

export const workoutTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1), // "Treino A"
  suggestedWeekday: z.number().int().min(0).max(6).nullable().default(null),
  order: z.number().int().min(1),
  blocks: z.array(workoutBlockSchema),
});
export type WorkoutTemplate = z.infer<typeof workoutTemplateSchema>;

export const mesocycleSchema = z.object({
  id: z.string().uuid(),
  order: z.number().int().min(1),
  weeks: z.number().int().min(1).max(12),
  emphasis: z.enum(["hypertrophy", "strength", "power", "deload", "intro"]),
  progressionModel: progressionModelSchema,
  includesDeload: z.boolean().default(false),
  workouts: z.array(workoutTemplateSchema),
  notes: z.string().nullable().default(null),
});
export type Mesocycle = z.infer<typeof mesocycleSchema>;

export const trainingPlanSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  clientId: z.string().uuid(),
  createdBy: z.string().uuid(),
  goal: trainingGoalSchema,
  engine: planEngineSchema,
  status: planStatusSchema,
  startDate: z.string().date(),
  endDate: z.string().date().nullable(),
  mesocycles: z.array(mesocycleSchema),
});
export type TrainingPlan = z.infer<typeof trainingPlanSchema>;
