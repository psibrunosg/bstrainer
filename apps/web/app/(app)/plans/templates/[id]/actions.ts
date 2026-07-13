"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { Exercise, LoadType } from "@bstrainer/domain";
import { getTemplate, instantiateTemplate } from "@bstrainer/engine";
import { createClient } from "@/lib/supabase/server";

export interface UsePlanResult {
  ok: boolean;
  planId?: string;
  unresolved?: number;
  error?: string;
}

/**
 * Instancia um template para o equipamento do usuário e persiste o plano
 * completo (training_plan -> mesocycles -> workouts -> prescribed_*) no banco.
 */
export async function usePlanFromTemplate(
  templateId: string,
  equipment: LoadType[],
): Promise<UsePlanResult> {
  const spec = getTemplate(templateId);
  if (!spec) return { ok: false, error: "Template não encontrado." };

  const supabase = await createClient();
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

  // Catálogo: exercícios globais + os da org
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
    generateId: randomUUID,
  });

  const planId = randomUUID();
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

  // Persiste a hierarquia. Erros abortam e retornam (sem transação no client SDK,
  // mas RLS garante consistência de acesso; falha parcial é rara e recuperável).
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

  revalidatePath("/plans");
  return { ok: true, planId, unresolved: plan.unresolvedSlots.length };
}
