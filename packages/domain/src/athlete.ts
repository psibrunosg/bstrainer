import { z } from "zod";
import { trainingGoalSchema } from "./plan";

export const athleteSexSchema = z.enum(["male", "female", "other"]);
export type AthleteSex = z.infer<typeof athleteSexSchema>;

export const athleteLevelSchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);
export type AthleteLevel = z.infer<typeof athleteLevelSchema>;

export const trainingLocationSchema = z.enum(["home", "outdoor", "gym"]);
export type TrainingLocation = z.infer<typeof trainingLocationSchema>;

export const athleteProfileSchema = z.object({
  profileId: z.string().uuid(),
  sex: athleteSexSchema.nullable().default(null),
  birthDate: z.string().date().nullable().default(null),
  weightKg: z.number().nullable().default(null),
  heightCm: z.number().nullable().default(null),
  level: athleteLevelSchema.default("beginner"),
  goal: trainingGoalSchema,
  trainingLocation: trainingLocationSchema.default("gym"),
  daysPerWeek: z.number().int().min(1).max(7).default(3),
  equipment: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type AthleteProfile = z.infer<typeof athleteProfileSchema>;
