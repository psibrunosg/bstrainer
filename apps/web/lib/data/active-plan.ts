import type {
  Activity,
  LoadMethod,
  SetTechnique,
  WorkoutBlock,
  WorkoutTemplate,
} from "@bstrainer/domain";
import { createClient } from "@/lib/supabase/client";
import { loadSessions } from "@/lib/data/sessions";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface NextWorkout {
  template: WorkoutTemplate;
  /** activityId -> nome/tipo/mídia, resolvido do catálogo de activities (poucas linhas, sem catálogo local como o de exercícios). */
  activityInfo: Record<string, Pick<Activity, "name" | "type" | "mediaUrl">>;
}

interface DbSetRow {
  id: string;
  position: number;
  reps_min: number;
  reps_max: number;
  load_method: string;
  load_value: number | null;
  target_rpe: number | null;
  target_rir: number | null;
  rest_seconds: number;
  is_warmup: boolean;
  is_amrap: boolean;
}
interface DbExerciseRow {
  id: string;
  exercise_id: string;
  position: number;
  technique: string;
  superset_group: number | null;
  notes: string | null;
  prescribed_sets: DbSetRow[] | null;
}
interface DbActivityRow {
  id: string;
  activity_id: string;
  position: number;
  duration_seconds: number | null;
  distance_km: number | null;
  target_pace_min_per_km: number | null;
  target_rpe: number | null;
  notes: string | null;
  activities: { name: string; type: string; media_url: string | null } | null;
}
interface DbCircuitExerciseRow {
  exercise_id: string;
  position: number;
}
interface DbCircuitRow {
  id: string;
  position: number;
  rounds: number;
  work_seconds: number;
  rest_seconds: number;
  target_rpe: number | null;
  notes: string | null;
  prescribed_circuit_exercises: DbCircuitExerciseRow[] | null;
}
interface DbWorkoutRow {
  id: string;
  name: string;
  suggested_weekday: number | null;
  position: number;
  prescribed_exercises: DbExerciseRow[] | null;
  prescribed_activities: DbActivityRow[] | null;
  prescribed_circuits: DbCircuitRow[] | null;
}

const WORKOUT_SELECT = `
  id, name, suggested_weekday, position,
  prescribed_exercises(id, exercise_id, position, technique, superset_group, notes,
    prescribed_sets(id, position, reps_min, reps_max, load_method, load_value, target_rpe, target_rir, rest_seconds, is_warmup, is_amrap)),
  prescribed_activities(id, activity_id, position, duration_seconds, distance_km, target_pace_min_per_km, target_rpe, notes,
    activities(name, type, media_url)),
  prescribed_circuits(id, position, rounds, work_seconds, rest_seconds, target_rpe, notes,
    prescribed_circuit_exercises(exercise_id, position))
`;

function mapWorkoutRow(row: DbWorkoutRow): NextWorkout {
  const activityInfo: NextWorkout["activityInfo"] = {};
  const blocks: WorkoutBlock[] = [];

  for (const pe of [...(row.prescribed_exercises ?? [])].sort((a, b) => a.position - b.position)) {
    blocks.push({
      kind: "exercise",
      id: pe.id,
      exerciseId: pe.exercise_id,
      order: pe.position,
      technique: pe.technique as SetTechnique,
      supersetGroup: pe.superset_group,
      notes: pe.notes,
      sets: [...(pe.prescribed_sets ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((s) => ({
          id: s.id,
          order: s.position,
          repsMin: s.reps_min,
          repsMax: s.reps_max,
          loadMethod: s.load_method as LoadMethod,
          loadValue: s.load_value,
          targetRpe: s.target_rpe,
          targetRir: s.target_rir,
          restSeconds: s.rest_seconds,
          isWarmup: s.is_warmup,
          isAmrap: s.is_amrap,
        })),
    });
  }

  for (const pa of row.prescribed_activities ?? []) {
    if (pa.activities) {
      activityInfo[pa.activity_id] = {
        name: pa.activities.name,
        type: pa.activities.type as Activity["type"],
        mediaUrl: pa.activities.media_url,
      };
    }
    blocks.push({
      kind: "activity",
      id: pa.id,
      activityId: pa.activity_id,
      order: pa.position,
      durationSeconds: pa.duration_seconds,
      distanceKm: pa.distance_km,
      targetPaceMinPerKm: pa.target_pace_min_per_km,
      targetRpe: pa.target_rpe,
      notes: pa.notes,
    });
  }

  for (const pc of row.prescribed_circuits ?? []) {
    blocks.push({
      kind: "circuit",
      id: pc.id,
      order: pc.position,
      exerciseIds: [...(pc.prescribed_circuit_exercises ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((e) => e.exercise_id),
      rounds: pc.rounds,
      workSeconds: pc.work_seconds,
      restSeconds: pc.rest_seconds,
      targetRpe: pc.target_rpe,
      notes: pc.notes,
    });
  }

  blocks.sort((a, b) => a.order - b.order);

  return {
    template: {
      id: row.id,
      name: row.name,
      suggestedWeekday: row.suggested_weekday,
      order: row.position,
      blocks,
    },
    activityInfo,
  };
}

/** Busca um workout_template específico com todos os blocks prescritos — usado pra reidratar a meta na tela de execução. */
export async function fetchWorkoutTemplate(templateId: string): Promise<NextWorkout | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("workout_templates")
    .select(WORKOUT_SELECT)
    .eq("id", templateId)
    .maybeSingle();
  if (!data) return null;
  return mapWorkoutRow(data as unknown as DbWorkoutRow);
}

/**
 * Próximo treino do plano ativo do aluno: escolhe o mesociclo pelas semanas
 * decorridas desde o início do plano, e o workout pela rotação (A->B->C->A...)
 * a partir do último workout_template_id realizado.
 */
export async function getNextWorkout(clientId?: string): Promise<NextWorkout | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const targetClientId = clientId ?? user?.id;
  if (!targetClientId) return null;

  const { data: planRow } = await supabase
    .from("training_plans")
    .select("id, start_date")
    .eq("client_id", targetClientId)
    .eq("status", "active")
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!planRow) return null;

  const { data: mesoRows } = await supabase
    .from("mesocycles")
    .select("id, position, weeks")
    .eq("plan_id", planRow.id)
    .order("position");
  if (!mesoRows || mesoRows.length === 0) return null;

  const elapsedWeeks = Math.floor((Date.now() - Date.parse(planRow.start_date)) / (7 * DAY_MS));
  let cumulative = 0;
  let currentMesoId = mesoRows[mesoRows.length - 1]!.id;
  for (const m of mesoRows) {
    cumulative += m.weeks;
    if (elapsedWeeks < cumulative) {
      currentMesoId = m.id;
      break;
    }
  }

  const { data: workoutRows } = await supabase
    .from("workout_templates")
    .select(WORKOUT_SELECT)
    .eq("mesocycle_id", currentMesoId)
    .order("position");
  if (!workoutRows || workoutRows.length === 0) return null;

  const rows = workoutRows as unknown as DbWorkoutRow[];
  const sessions = await loadSessions(clientId);
  const rowIds = rows.map((r) => r.id);
  const lastSession = sessions.find(
    (s) => s.workoutTemplateId && rowIds.includes(s.workoutTemplateId),
  );

  let nextIndex = 0;
  if (lastSession) {
    const idx = rows.findIndex((r) => r.id === lastSession.workoutTemplateId);
    if (idx >= 0) nextIndex = (idx + 1) % rows.length;
  }

  return mapWorkoutRow(rows[nextIndex]!);
}

export interface ActivePlanWorkouts {
  planId: string;
  planGoal: string;
  mesocyclePosition: number;
  mesocycleWeeks: number;
  nextWorkoutId: string | null;
  workouts: NextWorkout[];
}

/**
 * Retorna todos os treinos do mesociclo ativo com a indicação do próximo treino na rotação,
 * para exibição detalhada no accordion "Sua Ficha" e "O que tem para hoje".
 */
export async function getActivePlanWorkouts(clientId?: string): Promise<ActivePlanWorkouts | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const targetClientId = clientId ?? user?.id;
  if (!targetClientId) return null;

  const { data: planRow } = await supabase
    .from("training_plans")
    .select("id, goal, start_date")
    .eq("client_id", targetClientId)
    .eq("status", "active")
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!planRow) return null;

  const { data: mesoRows } = await supabase
    .from("mesocycles")
    .select("id, position, weeks")
    .eq("plan_id", planRow.id)
    .order("position");
  if (!mesoRows || mesoRows.length === 0) return null;

  const elapsedWeeks = Math.floor((Date.now() - Date.parse(planRow.start_date)) / (7 * DAY_MS));
  let cumulative = 0;
  let currentMeso = mesoRows[mesoRows.length - 1]!;
  for (const m of mesoRows) {
    cumulative += m.weeks;
    if (elapsedWeeks < cumulative) {
      currentMeso = m;
      break;
    }
  }

  const { data: workoutRows } = await supabase
    .from("workout_templates")
    .select(WORKOUT_SELECT)
    .eq("mesocycle_id", currentMeso.id)
    .order("position");
  if (!workoutRows || workoutRows.length === 0) return null;

  const rows = workoutRows as unknown as DbWorkoutRow[];
  const sessions = await loadSessions(clientId);
  const rowIds = rows.map((r) => r.id);
  const lastSession = sessions.find(
    (s) => s.workoutTemplateId && rowIds.includes(s.workoutTemplateId),
  );

  let nextIndex = 0;
  if (lastSession) {
    const idx = rows.findIndex((r) => r.id === lastSession.workoutTemplateId);
    if (idx >= 0) nextIndex = (idx + 1) % rows.length;
  }

  const nextWorkoutId = rows[nextIndex]?.id ?? null;
  const workouts = rows.map(mapWorkoutRow);

  return {
    planId: planRow.id,
    planGoal: planRow.goal,
    mesocyclePosition: currentMeso.position,
    mesocycleWeeks: currentMeso.weeks,
    nextWorkoutId,
    workouts,
  };
}

