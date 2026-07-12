import { z } from "zod";

/** Padrões de movimento canônicos — base para volume por padrão e substituições. */
export const movementPatternSchema = z.enum([
  "squat",
  "hinge",
  "push_h",
  "push_v",
  "pull_h",
  "pull_v",
  "lunge",
  "carry",
  "core",
  "isolation",
]);
export type MovementPattern = z.infer<typeof movementPatternSchema>;

export const loadTypeSchema = z.enum([
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "bodyweight",
  "band",
  "kettlebell",
  "time",
]);
export type LoadType = z.infer<typeof loadTypeSchema>;

export const muscleGroupSchema = z.enum([
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "core",
  "full_body",
]);
export type MuscleGroup = z.infer<typeof muscleGroupSchema>;

export const exerciseSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid().nullable(), // null = global (importado/curado)
  name: z.string().min(1),
  movementPattern: movementPatternSchema,
  primaryMuscles: z.array(muscleGroupSchema).min(1),
  secondaryMuscles: z.array(muscleGroupSchema).default([]),
  loadType: loadTypeSchema,
  unilateral: z.boolean().default(false),
  instructions: z.string().nullable().default(null),
  mediaUrl: z.string().url().nullable().default(null),
  source: z.enum(["wger", "custom"]).default("custom"),
  externalId: z.string().nullable().default(null),
});
export type Exercise = z.infer<typeof exerciseSchema>;
