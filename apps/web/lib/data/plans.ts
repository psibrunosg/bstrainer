import type { Exercise, LoadType } from "@bstrainer/domain";
import { getTemplate, instantiateTemplate } from "@bstrainer/engine";
import { createClient } from "@/lib/supabase/client";

export interface UsePlanResult {
  ok: boolean;
  planId?: string;
  unresolved?: number;
  error?: string;
}

/**
 * Instancia um template para o equipamento do usuário e persiste o plano
 * completo no banco. Roda no browser; RLS garante o isolamento por org.
 */
export async function usePlanFromTemplate(
  templateId: string,
  equipment: LoadType[],
): Promise<UsePlanResult> {
  const spec = getTemplate(templateId);
  if (!spec) return { ok: false, error: "Template não encontrado." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("profile_id", user.id)
    .limit(1)
    .single();
  if (!membership) return { ok: false, error: "Organização não encontrada." };

  const { data: rows, error: exErr } = await supabase
    .from("exercises")
    .select(
      "id, org_id, name, movement_pattern, primary_muscles, secondary_muscles, load_type, unilateral, instructions, media_url, source, external_id",
    );
  if (exErr || !rows) return { ok: false, error: "Falha ao carregar exercícios." };

  const catalog: Exercise[] = rows.map((r) => ({
    id: r.id,
    orgId: r.org_id,
    name: r.name,
    movementPattern: r.movement_pattern as Exercise["movementPattern"],
    primaryMuscles: (r.primary_muscles ?? []) as Exercise["primaryMuscles"],
    secondaryMuscles: (r.secondary_muscles ?? []) as Exercise["secondaryMuscles"],
    loadType: r.load_type as LoadType,
    unilateral: r.unilateral,
    instructions: r.instructions,
    mediaUrl: r.media_url,
    source: r.source as Exercise["source"],
    externalId: r.external_id,
  }));

  const plan = instantiateTemplate(spec, catalog, {
    availableEquipment: equipment,
    generateId: () => crypto.randomUUID(),
  });

  const planId = crypto.randomUUID();
  const today = new Date().toISOString().slice(0, 10);

  const { error: planErr } = await supabase.from("training_plans").insert({
    id: planId,
    org_id: membership.org_id,
    client_id: user.id,
    created_by: user.id,
    goal: plan.goal,
    engine: "template",
    status: "active",
    start_date: today,
    source_template_id: null,
  });
  if (planErr) return { ok: false, error: "Falha ao criar plano." };

  for (const meso of plan.mesocycles) {
    const { error: mErr } = await supabase.from("mesocycles").insert({
      id: meso.id,
      plan_id: planId,
      position: meso.order,
      weeks: meso.weeks,
      emphasis: meso.emphasis,
      progression_model: meso.progressionModel,
      includes_deload: meso.includesDeload,
      notes: meso.notes,
    });
    if (mErr) return { ok: false, error: "Falha ao salvar mesociclo." };

    for (const workout of meso.workouts) {
      const { error: wErr } = await supabase.from("workout_templates").insert({
        id: workout.id,
        mesocycle_id: meso.id,
        name: workout.name,
        suggested_weekday: workout.suggestedWeekday,
        position: workout.order,
      });
      if (wErr) return { ok: false, error: "Falha ao salvar treino." };

      for (const ex of workout.exercises) {
        const { error: peErr } = await supabase
          .from("prescribed_exercises")
          .insert({
            id: ex.id,
            workout_template_id: workout.id,
            exercise_id: ex.exerciseId,
            position: ex.order,
            technique: ex.technique,
            superset_group: ex.supersetGroup,
            notes: ex.notes,
          });
        if (peErr) return { ok: false, error: "Falha ao salvar exercício." };

        if (ex.sets.length > 0) {
          const { error: psErr } = await supabase.from("prescribed_sets").insert(
            ex.sets.map((s) => ({
              id: s.id,
              prescribed_exercise_id: ex.id,
              position: s.order,
              reps_min: s.repsMin,
              reps_max: s.repsMax,
              load_method: s.loadMethod,
              load_value: s.loadValue,
              target_rpe: s.targetRpe,
              target_rir: s.targetRir,
              rest_seconds: s.restSeconds,
              is_warmup: s.isWarmup,
              is_amrap: s.isAmrap,
            })),
          );
          if (psErr) return { ok: false, error: "Falha ao salvar séries." };
        }
      }
    }
  }

  return { ok: true, planId, unresolved: plan.unresolvedSlots.length };
}

export interface ExerciseOption {
  id: string;
  name: string;
  mediaUrl: string | null;
}

/**
 * Busca exercícios do catálogo por nome (ilike). Roda no browser; RLS
 * restringe ao catálogo global + exercícios da org.
 */
export async function searchExercises(term: string): Promise<ExerciseOption[]> {
  const clean = term.trim();
  if (clean.length < 2) return [];

  const supabase = createClient();
  const { data } = await supabase
    .from("exercises")
    .select("id, name, media_url")
    .ilike("name", `%${clean}%`)
    .order("name", { ascending: true })
    .limit(20);

  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    mediaUrl: r.media_url,
  }));
}

export interface ManualPlanExercise {
  exerciseId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  loadMethod: string;
  restSeconds: number;
}

export interface ManualPlanInput {
  goal: string;
  workoutName: string;
  exercises: ManualPlanExercise[];
}

// Emphasis do mesociclo derivada do objetivo (enum emphasis é mais restrito).
const EMPHASIS_BY_GOAL: Record<string, string> = {
  hypertrophy: "hypertrophy",
  strength: "strength",
  power: "power",
  endurance: "hypertrophy",
  health: "intro",
  fat_loss: "hypertrophy",
};

/**
 * Cria uma ficha manual simples: 1 mesociclo linear de 4 semanas, 1 treino,
 * com os exercícios e séries informados. Roda no browser; RLS isola por org.
 */
export async function createManualPlan(
  input: ManualPlanInput,
): Promise<UsePlanResult> {
  if (input.exercises.length === 0) {
    return { ok: false, error: "Adicione ao menos um exercício." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("profile_id", user.id)
    .limit(1)
    .single();
  if (!membership) return { ok: false, error: "Organização não encontrada." };

  const planId = crypto.randomUUID();
  const mesoId = crypto.randomUUID();
  const workoutId = crypto.randomUUID();
  const today = new Date().toISOString().slice(0, 10);

  const { error: planErr } = await supabase.from("training_plans").insert({
    id: planId,
    org_id: membership.org_id,
    client_id: user.id,
    created_by: user.id,
    goal: input.goal,
    engine: "assisted",
    status: "active",
    start_date: today,
    source_template_id: null,
  });
  if (planErr) return { ok: false, error: "Falha ao criar plano." };

  const { error: mErr } = await supabase.from("mesocycles").insert({
    id: mesoId,
    plan_id: planId,
    position: 1,
    weeks: 4,
    emphasis: EMPHASIS_BY_GOAL[input.goal] ?? "hypertrophy",
    progression_model: "linear",
    includes_deload: false,
    notes: null,
  });
  if (mErr) return { ok: false, error: "Falha ao salvar mesociclo." };

  const { error: wErr } = await supabase.from("workout_templates").insert({
    id: workoutId,
    mesocycle_id: mesoId,
    name: input.workoutName.trim() || "Treino A",
    suggested_weekday: null,
    position: 1,
  });
  if (wErr) return { ok: false, error: "Falha ao salvar treino." };

  let position = 0;
  for (const ex of input.exercises) {
    position += 1;
    const peId = crypto.randomUUID();

    const { error: peErr } = await supabase
      .from("prescribed_exercises")
      .insert({
        id: peId,
        workout_template_id: workoutId,
        exercise_id: ex.exerciseId,
        position,
        technique: "straight",
        superset_group: null,
        notes: null,
      });
    if (peErr) return { ok: false, error: "Falha ao salvar exercício." };

    const setCount = Math.max(1, ex.sets);
    const sets = Array.from({ length: setCount }, (_, j) => ({
      id: crypto.randomUUID(),
      prescribed_exercise_id: peId,
      position: j + 1,
      reps_min: ex.repsMin,
      reps_max: ex.repsMax,
      load_method: ex.loadMethod,
      load_value: null,
      target_rpe: null,
      target_rir: null,
      rest_seconds: ex.restSeconds,
      is_warmup: false,
      is_amrap: false,
    }));

    const { error: psErr } = await supabase.from("prescribed_sets").insert(sets);
    if (psErr) return { ok: false, error: "Falha ao salvar séries." };
  }

  return { ok: true, planId };
}

export interface PlanSummary {
  id: string;
  goal: string;
  status: string;
  start_date: string;
  mesocycleCount: number;
}

export async function listPlans(): Promise<PlanSummary[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("training_plans")
    .select("id, goal, status, start_date, mesocycles(count)")
    .in("status", ["active", "draft"])
    .order("start_date", { ascending: false });

  return ((data ?? []) as unknown as {
    id: string;
    goal: string;
    status: string;
    start_date: string;
    mesocycles: { count: number }[];
  }[]).map((p) => ({
    id: p.id,
    goal: p.goal,
    status: p.status,
    start_date: p.start_date,
    mesocycleCount: p.mesocycles?.[0]?.count ?? 0,
  }));
}
