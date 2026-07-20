import type {
  Activity,
  Exercise,
  LoadType,
  Mesocycle,
  PrescribedActivity,
  PrescribedCircuit,
  PrescribedExercise,
  PrescribedSet,
  WorkoutBlock,
  WorkoutTemplate,
} from "@bstrainer/domain";
import type {
  PlanTemplateSpec,
  SetScheme,
  TemplateActivitySlot,
  TemplateBlock,
  TemplateCircuitSlot,
  TemplateSlot,
} from "./types";

export interface InstantiateOptions {
  /** Equipamentos disponíveis pro usuário — resolve os slots de exercício/circuito. */
  availableEquipment: LoadType[];
  /** Gerador de ids (uuid em produção; determinístico em teste). */
  generateId: () => string;
}

export interface InstantiatedPlan {
  goal: PlanTemplateSpec["goal"];
  sourceTemplateId: string;
  mesocycles: Mesocycle[];
  /** Blocks sem exercício/activity compatível — exibir aviso pro usuário. */
  unresolvedSlots: { workout: string; slot: string }[];
}

/**
 * Resolve um slot em exercício concreto:
 * 1. Padrão de movimento igual + equipamento prioritário do template, se disponível
 * 2. Padrão igual + qualquer equipamento disponível
 * 3. null (slot não resolvido — caller decide)
 */
export function resolveSlot(
  slot: TemplateSlot,
  catalog: Exercise[],
  availableEquipment: LoadType[],
): Exercise | null {
  const byPattern = catalog.filter(
    (e) => e.movementPattern === slot.slot,
  );
  if (byPattern.length === 0) return null;

  if (availableEquipment.includes(slot.priorityEquipment)) {
    const exact = byPattern.find((e) => e.loadType === slot.priorityEquipment);
    if (exact) return exact;
  }
  return (
    byPattern.find((e) => availableEquipment.includes(e.loadType)) ?? null
  );
}

/** Resolve um slot de activity no primeiro Activity do catálogo com o tipo pedido. */
export function resolveActivity(
  slot: TemplateActivitySlot,
  activityCatalog: Activity[],
): Activity | null {
  return activityCatalog.find((a) => a.type === slot.activityType) ?? null;
}

/** Expande o esquema comprimido em séries prescritas concretas. */
export function expandSetScheme(
  scheme: SetScheme,
  generateId: () => string,
): PrescribedSet[] {
  const sets: PrescribedSet[] = [];
  for (let i = 1; i <= scheme.setCount; i++) {
    sets.push({
      id: generateId(),
      order: i,
      repsMin: scheme.repsMin,
      repsMax: scheme.repsMax,
      loadMethod:
        scheme.loadMethod === "percent_1rm" ? "percent_1rm" : scheme.loadMethod,
      loadValue: scheme.loadValue ?? null,
      targetRpe: scheme.targetRpe ?? null,
      targetRir: scheme.targetRir ?? null,
      restSeconds: scheme.restSeconds,
      isWarmup: false,
      isAmrap: scheme.lastSetAmrap === true && i === scheme.setCount,
    });
  }
  return sets;
}

function resolveBlock(
  block: TemplateBlock,
  order: number,
  workoutName: string,
  catalog: Exercise[],
  activityCatalog: Activity[],
  availableEquipment: LoadType[],
  generateId: () => string,
  unresolvedSlots: InstantiatedPlan["unresolvedSlots"],
): WorkoutBlock | null {
  if (block.kind === "exercise") {
    const exercise = resolveSlot(block, catalog, availableEquipment);
    if (!exercise) {
      unresolvedSlots.push({ workout: workoutName, slot: block.slot });
      return null;
    }
    const prescribed: PrescribedExercise = {
      id: generateId(),
      exerciseId: exercise.id,
      order,
      technique: "straight",
      supersetGroup: null,
      sets: expandSetScheme(block.setScheme, generateId),
      notes: block.note ?? null,
    };
    return { ...prescribed, kind: "exercise" };
  }

  if (block.kind === "activity") {
    const activity = resolveActivity(block, activityCatalog);
    if (!activity) {
      unresolvedSlots.push({ workout: workoutName, slot: block.activityType });
      return null;
    }
    const prescribed: PrescribedActivity = {
      id: generateId(),
      activityId: activity.id,
      order,
      durationSeconds: block.durationMinutes ? block.durationMinutes * 60 : null,
      distanceKm: block.distanceKm,
      targetPaceMinPerKm: block.targetPaceMinPerKm,
      targetRpe: block.targetRpe,
      notes: block.note ?? null,
    };
    return { ...prescribed, kind: "activity" };
  }

  // block.kind === "circuit"
  const exerciseIds: string[] = [];
  for (const pattern of block.movementPatterns) {
    const exercise = resolveSlot(
      { slot: pattern, suggestedVariant: "", priorityEquipment: "bodyweight", setScheme: {
        setCount: 1, repsMin: 1, repsMax: 1, loadMethod: "bodyweight", restSeconds: 0, lastSetAmrap: false,
      } },
      catalog,
      availableEquipment,
    );
    if (!exercise) {
      unresolvedSlots.push({ workout: workoutName, slot: pattern });
      return null;
    }
    exerciseIds.push(exercise.id);
  }
  const prescribed: PrescribedCircuit = {
    id: generateId(),
    order,
    exerciseIds,
    rounds: block.rounds,
    workSeconds: block.workSeconds,
    restSeconds: block.restSeconds,
    targetRpe: block.targetRpe,
    notes: block.note ?? null,
  };
  return { ...prescribed, kind: "circuit" };
}

/** Instancia um template completo em estrutura de plano pronta pra persistir. */
export function instantiateTemplate(
  spec: PlanTemplateSpec,
  catalog: Exercise[],
  options: InstantiateOptions,
  activityCatalog: Activity[] = [],
): InstantiatedPlan {
  const unresolvedSlots: InstantiatedPlan["unresolvedSlots"] = [];
  const { generateId, availableEquipment } = options;

  const mesocycles: Mesocycle[] = spec.mesocycles.map((meso, mesoIdx) => {
    const workouts: WorkoutTemplate[] = meso.workouts.map(
      (workout, workoutIdx) => {
        const blocks: WorkoutBlock[] = [];
        for (const [blockIdx, block] of workout.blocks.entries()) {
          const resolved = resolveBlock(
            block,
            blockIdx + 1,
            workout.name,
            catalog,
            activityCatalog,
            availableEquipment,
            generateId,
            unresolvedSlots,
          );
          if (resolved) blocks.push(resolved);
        }
        return {
          id: generateId(),
          name: workout.name,
          suggestedWeekday: workout.suggestedWeekday % 7, // 7 (domingo) -> 0
          order: workoutIdx + 1,
          blocks,
        };
      },
    );

    return {
      id: generateId(),
      order: mesoIdx + 1,
      weeks: meso.weeks,
      emphasis: meso.emphasis,
      progressionModel: meso.progressionModel,
      includesDeload: meso.includesDeload,
      workouts,
      notes: meso.microcycleNote ?? meso.deloadNote ?? null,
    };
  });

  return {
    goal: spec.goal,
    sourceTemplateId: spec.id,
    mesocycles,
    unresolvedSlots,
  };
}
