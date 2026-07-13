import type {
  Exercise,
  LoadType,
  Mesocycle,
  MovementPattern,
  PrescribedExercise,
  PrescribedSet,
  WorkoutTemplate,
} from "@bstrainer/domain";
import type {
  PlanTemplateSpec,
  SetScheme,
  TemplateSlot,
} from "./types";

export interface InstantiateOptions {
  /** Equipamentos disponíveis pro usuário — resolve os slots. */
  availableEquipment: LoadType[];
  /** Gerador de ids (uuid em produção; determinístico em teste). */
  generateId: () => string;
}

export interface InstantiatedPlan {
  goal: PlanTemplateSpec["goal"];
  sourceTemplateId: string;
  mesocycles: Mesocycle[];
  /** Slots sem exercício compatível — exibir aviso pro usuário. */
  unresolvedSlots: { workout: string; slot: MovementPattern }[];
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

/** Instancia um template completo em estrutura de plano pronta pra persistir. */
export function instantiateTemplate(
  spec: PlanTemplateSpec,
  catalog: Exercise[],
  options: InstantiateOptions,
): InstantiatedPlan {
  const unresolvedSlots: InstantiatedPlan["unresolvedSlots"] = [];
  const { generateId, availableEquipment } = options;

  const mesocycles: Mesocycle[] = spec.mesocycles.map((meso, mesoIdx) => {
    const workouts: WorkoutTemplate[] = meso.workouts.map(
      (workout, workoutIdx) => {
        const exercises: PrescribedExercise[] = [];
        for (const [slotIdx, slot] of workout.exercises.entries()) {
          const exercise = resolveSlot(slot, catalog, availableEquipment);
          if (!exercise) {
            unresolvedSlots.push({ workout: workout.name, slot: slot.slot });
            continue;
          }
          exercises.push({
            id: generateId(),
            exerciseId: exercise.id,
            order: slotIdx + 1,
            technique: "straight",
            supersetGroup: null,
            sets: expandSetScheme(slot.setScheme, generateId),
            notes: slot.note ?? null,
          });
        }
        return {
          id: generateId(),
          name: workout.name,
          suggestedWeekday: workout.suggestedWeekday % 7, // 7 (domingo) -> 0
          order: workoutIdx + 1,
          exercises,
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
