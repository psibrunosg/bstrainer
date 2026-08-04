import { z } from "zod";

export const bodyMeasurementSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  measuredAt: z.string().date(),

  weightKg: z.number().nullable().default(null),
  bodyFatPct: z.number().nullable().default(null),
  chestCm: z.number().nullable().default(null),
  waistCm: z.number().nullable().default(null),
  hipCm: z.number().nullable().default(null),
  bicepRightCm: z.number().nullable().default(null),
  thighRightCm: z.number().nullable().default(null),

  notes: z.string().nullable().default(null),
  createdAt: z.string().datetime(),
});
export type BodyMeasurement = z.infer<typeof bodyMeasurementSchema>;

/** Schema para criar/actualizar medição — sem id, userId, createdAt. */
export const bodyMeasurementInputSchema = z.object({
  measuredAt: z.string().date(),

  weightKg: z.number().min(0).nullable().default(null),
  bodyFatPct: z.number().min(0).max(100).nullable().default(null),
  chestCm: z.number().min(0).nullable().default(null),
  waistCm: z.number().min(0).nullable().default(null),
  hipCm: z.number().min(0).nullable().default(null),
  bicepRightCm: z.number().min(0).nullable().default(null),
  thighRightCm: z.number().min(0).nullable().default(null),

  notes: z.string().nullable().default(null),
});
export type BodyMeasurementInput = z.infer<typeof bodyMeasurementInputSchema>;
