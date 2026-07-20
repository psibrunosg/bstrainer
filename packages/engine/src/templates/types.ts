import { z } from "zod";
import {
  activityTypeSchema,
  loadMethodSchema,
  movementPatternSchema,
  progressionModelSchema,
  trainingGoalSchema,
} from "@bstrainer/domain";
import { loadTypeSchema } from "@bstrainer/domain";

/** Esquema de séries comprimido do template — o instanciador expande em PrescribedSet[]. */
export const setSchemeSchema = z.object({
  setCount: z.number().int().min(1).max(10),
  repsMin: z.number().int().min(1),
  repsMax: z.number().int().min(1),
  loadMethod: loadMethodSchema.or(z.enum(["rpe", "rir", "percent_1rm", "bodyweight"])),
  loadValue: z.number().optional(),
  targetRpe: z.number().min(1).max(10).optional(),
  targetRir: z.number().int().min(0).max(10).optional(),
  restSeconds: z.number().int().min(0),
  lastSetAmrap: z.boolean().default(false),
});
export type SetScheme = z.infer<typeof setSchemeSchema>;

/** Slot por padrão de movimento — resolvido em exercício concreto pelo equipamento disponível. */
export const templateSlotSchema = z.object({
  slot: movementPatternSchema,
  suggestedVariant: z.string(),
  priorityEquipment: loadTypeSchema,
  setScheme: setSchemeSchema,
  note: z.string().optional(),
  technique: z.string().optional(),
});
export type TemplateSlot = z.infer<typeof templateSlotSchema>;

/** Slot de esforço contínuo (corrida, bike) — resolvido pelo tipo de Activity, não por equipamento. */
export const templateActivitySlotSchema = z.object({
  activityType: activityTypeSchema,
  durationMinutes: z.number().min(1).nullable().default(null),
  distanceKm: z.number().min(0).nullable().default(null),
  targetPaceMinPerKm: z.number().min(0).nullable().default(null),
  targetRpe: z.number().min(1).max(10).nullable().default(null),
  note: z.string().optional(),
});
export type TemplateActivitySlot = z.infer<typeof templateActivitySlotSchema>;

/** Slot de circuito por rounds (HIIT) — cada padrão de movimento resolve num exercício. */
export const templateCircuitSlotSchema = z.object({
  movementPatterns: z.array(movementPatternSchema).min(1),
  rounds: z.number().int().min(1),
  workSeconds: z.number().int().min(1),
  restSeconds: z.number().int().min(0),
  targetRpe: z.number().min(1).max(10).nullable().default(null),
  note: z.string().optional(),
});
export type TemplateCircuitSlot = z.infer<typeof templateCircuitSlotSchema>;

/** Um item da lista ordenada de um TemplateWorkout — espelha WorkoutBlock, mas pré-instanciação. */
export const templateBlockSchema = z.discriminatedUnion("kind", [
  templateSlotSchema.extend({ kind: z.literal("exercise") }),
  templateActivitySlotSchema.extend({ kind: z.literal("activity") }),
  templateCircuitSlotSchema.extend({ kind: z.literal("circuit") }),
]);
export type TemplateBlock = z.infer<typeof templateBlockSchema>;

export const templateWorkoutSchema = z.object({
  name: z.string(),
  suggestedWeekday: z.number().int().min(1).max(7),
  blocks: z.array(templateBlockSchema).min(1),
});
export type TemplateWorkout = z.infer<typeof templateWorkoutSchema>;

export const templateMesocycleSchema = z.object({
  weeks: z.number().int().min(1).max(12),
  emphasis: z.enum(["hypertrophy", "strength", "power", "deload", "intro"]),
  progressionModel: progressionModelSchema,
  includesDeload: z.boolean(),
  workouts: z.array(templateWorkoutSchema).min(1),
  microcycleNote: z.string().optional(),
  deloadNote: z.string().optional(),
  weeklyIntensityWave: z.string().optional(),
  phase: z.string().optional(),
});
export type TemplateMesocycle = z.infer<typeof templateMesocycleSchema>;

export const planTemplateSpecSchema = z.object({
  id: z.string(),
  name: z.string(),
  goal: trainingGoalSchema,
  level: z.enum(["beginner", "intermediate", "advanced"]),
  daysPerWeek: z.number().int().min(1).max(7),
  rationale: z.string(),
  mesocycles: z.array(templateMesocycleSchema).min(1),
  progressionRule: z.string(),
});
export type PlanTemplateSpec = z.infer<typeof planTemplateSpecSchema>;
