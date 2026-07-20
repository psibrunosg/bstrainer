import { z } from "zod";

/** Modalidades de cardio/condicionamento cobertas pelo catálogo de Activity. */
export const activityTypeSchema = z.enum([
  "running",
  "cycling",
  "swimming",
  "rowing",
  "walking",
  "elliptical",
]);
export type ActivityType = z.infer<typeof activityTypeSchema>;

export const activitySchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid().nullable(), // null = global (importado/curado)
  name: z.string().min(1),
  type: activityTypeSchema,
  instructions: z.string().nullable().default(null),
  mediaUrl: z.string().url().nullable().default(null),
});
export type Activity = z.infer<typeof activitySchema>;
