import { z } from "zod";

export const sessionStatusSchema = z.enum([
  "in_progress",
  "completed",
  "skipped",
  "partial",
]);
export type SessionStatus = z.infer<typeof sessionStatusSchema>;

/** Série executada — o grão mais fino do sistema. e1RM sempre derivado, nunca armazenado. */
export const performedSetSchema = z.object({
  id: z.string().uuid(),
  order: z.number().int().min(1),
  reps: z.number().int().min(0),
  loadKg: z.number().min(0).nullable(), // null p/ bodyweight puro
  rpe: z.number().min(1).max(10).nullable().default(null),
  rir: z.number().int().min(0).max(10).nullable().default(null),
  isFailure: z.boolean().default(false),
  isWarmup: z.boolean().default(false),
  timeSeconds: z.number().int().min(0).nullable().default(null),
  notes: z.string().nullable().default(null),
});
export type PerformedSet = z.infer<typeof performedSetSchema>;

export const performedExerciseSchema = z.object({
  id: z.string().uuid(),
  exerciseId: z.string().uuid(),
  prescribedExerciseId: z.string().uuid().nullable(), // null = treino livre
  order: z.number().int().min(1),
  wasSubstituted: z.boolean().default(false),
  sets: z.array(performedSetSchema),
});
export type PerformedExercise = z.infer<typeof performedExerciseSchema>;

/** Execução registrada de uma PrescribedActivity. Sem HR/frequência cardíaca na v1. */
export const performedActivitySchema = z.object({
  id: z.string().uuid(),
  activityId: z.string().uuid(),
  prescribedActivityId: z.string().uuid().nullable(), // null = atividade livre
  order: z.number().int().min(1),
  durationSeconds: z.number().int().min(0).nullable().default(null),
  distanceKm: z.number().min(0).nullable().default(null),
  avgPaceMinPerKm: z.number().min(0).nullable().default(null),
  rpe: z.number().min(1).max(10).nullable().default(null),
});
export type PerformedActivity = z.infer<typeof performedActivitySchema>;

/** Execução registrada de um PrescribedCircuit. */
export const performedCircuitSchema = z.object({
  id: z.string().uuid(),
  prescribedCircuitId: z.string().uuid().nullable(), // null = circuito livre
  order: z.number().int().min(1),
  roundsCompleted: z.number().int().min(0),
  rpe: z.number().min(1).max(10).nullable().default(null),
});
export type PerformedCircuit = z.infer<typeof performedCircuitSchema>;

/** Um item da lista ordenada de um WorkoutSession — espelha WorkoutBlock do lado prescrito. */
export const performedBlockSchema = z.discriminatedUnion("kind", [
  performedExerciseSchema.extend({ kind: z.literal("exercise") }),
  performedActivitySchema.extend({ kind: z.literal("activity") }),
  performedCircuitSchema.extend({ kind: z.literal("circuit") }),
]);
export type PerformedBlock = z.infer<typeof performedBlockSchema>;

/** Narrowing helper — a maioria das métricas (tonnage, XP, volume) só olha exercícios de força. */
export function isPerformedExercise(
  block: PerformedBlock,
): block is PerformedExercise & { kind: "exercise" } {
  return block.kind === "exercise";
}

/** Prontidão pré-treino opcional (1-5). */
export const readinessSchema = z.object({
  sleep: z.number().int().min(1).max(5).nullable().default(null),
  soreness: z.number().int().min(1).max(5).nullable().default(null),
  energy: z.number().int().min(1).max(5).nullable().default(null),
});
export type Readiness = z.infer<typeof readinessSchema>;

export const workoutSessionSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  workoutTemplateId: z.string().uuid().nullable(), // null = treino livre
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().nullable(),
  status: sessionStatusSchema,
  /** sRPE 0-10 da sessão inteira — sRPE x duração = carga de sessão (Foster). */
  sessionRpe: z.number().min(0).max(10).nullable().default(null),
  readiness: readinessSchema.nullable().default(null),
  notes: z.string().nullable().default(null),
  blocks: z.array(performedBlockSchema),
});
export type WorkoutSession = z.infer<typeof workoutSessionSchema>;
