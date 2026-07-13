import { describe, expect, it } from "vitest";
import type { Exercise } from "@bstrainer/domain";
import { expandSetScheme, instantiateTemplate, resolveSlot } from "./instantiate";
import { templateLibrary, getTemplate } from "./library";

let counter = 0;
const genId = () => `id-${++counter}`;

const catalog: Exercise[] = [
  mk("e-squat-bb", "Agachamento livre", "squat", "barbell"),
  mk("e-squat-db", "Agachamento goblet", "squat", "dumbbell"),
  mk("e-bench", "Supino reto", "push_h", "barbell"),
  mk("e-pushup", "Flexão de braço", "push_h", "bodyweight"),
  mk("e-dl", "Levantamento terra", "hinge", "barbell"),
  mk("e-rdl-db", "Stiff com halteres", "hinge", "dumbbell"),
  mk("e-row-bb", "Remada curvada", "pull_h", "barbell"),
  mk("e-row-db", "Remada unilateral", "pull_h", "dumbbell"),
  mk("e-ohp", "Desenvolvimento militar", "push_v", "barbell"),
  mk("e-ohp-db", "Desenvolvimento halteres", "push_v", "dumbbell"),
  mk("e-pullup", "Barra fixa", "pull_v", "bodyweight"),
  mk("e-lat", "Puxada frontal", "pull_v", "cable"),
  mk("e-lunge", "Afundo", "lunge", "bodyweight"),
  mk("e-carry", "Farmer walk", "carry", "dumbbell"),
  mk("e-plank", "Prancha", "core", "bodyweight"),
  mk("e-curl", "Rosca direta", "isolation", "barbell"),
  mk("e-lateral", "Elevação lateral", "isolation", "dumbbell"),
  mk("e-legcurl", "Mesa flexora", "isolation", "machine"),
  mk("e-calf", "Panturrilha em pé", "isolation", "machine"),
  mk("e-crunch", "Abdominal no cabo", "core", "cable"),
];

function mk(
  id: string,
  name: string,
  pattern: Exercise["movementPattern"],
  loadType: Exercise["loadType"],
): Exercise {
  return {
    id,
    orgId: null,
    name,
    movementPattern: pattern,
    primaryMuscles: ["full_body"],
    secondaryMuscles: [],
    loadType,
    unilateral: false,
    instructions: null,
    mediaUrl: null,
    source: "custom",
    externalId: null,
  };
}

describe("templateLibrary", () => {
  it("loads and validates all templates", () => {
    expect(templateLibrary.length).toBeGreaterThanOrEqual(3);
  });
  it("finds template by id", () => {
    expect(getTemplate("linear-beginner-fullbody-3x")?.daysPerWeek).toBe(3);
  });
});

describe("resolveSlot", () => {
  const slot = {
    slot: "squat" as const,
    suggestedVariant: "back squat",
    priorityEquipment: "barbell" as const,
    setScheme: {
      setCount: 3,
      repsMin: 5,
      repsMax: 5,
      loadMethod: "rir" as const,
      targetRir: 2,
      restSeconds: 180,
      lastSetAmrap: false,
    },
  };

  it("prefers priority equipment when available", () => {
    const ex = resolveSlot(slot, catalog, ["barbell", "dumbbell"]);
    expect(ex?.id).toBe("e-squat-bb");
  });
  it("falls back to any available equipment", () => {
    const ex = resolveSlot(slot, catalog, ["dumbbell"]);
    expect(ex?.id).toBe("e-squat-db");
  });
  it("returns null when nothing matches", () => {
    const ex = resolveSlot(slot, catalog, ["band"]);
    expect(ex).toBeNull();
  });
});

describe("expandSetScheme", () => {
  it("expands setCount into ordered sets", () => {
    const sets = expandSetScheme(
      {
        setCount: 3,
        repsMin: 8,
        repsMax: 12,
        loadMethod: "rir",
        targetRir: 2,
        restSeconds: 90,
        lastSetAmrap: true,
      },
      genId,
    );
    expect(sets).toHaveLength(3);
    expect(sets.map((s) => s.order)).toEqual([1, 2, 3]);
    expect(sets[0]!.isAmrap).toBe(false);
    expect(sets[2]!.isAmrap).toBe(true);
  });
});

describe("instantiateTemplate", () => {
  it("instantiates linear beginner template with full barbell gym", () => {
    const spec = getTemplate("linear-beginner-fullbody-3x")!;
    const plan = instantiateTemplate(spec, catalog, {
      availableEquipment: ["barbell", "dumbbell", "cable", "bodyweight", "machine"],
      generateId: genId,
    });
    expect(plan.sourceTemplateId).toBe("linear-beginner-fullbody-3x");
    expect(plan.mesocycles).toHaveLength(1);
    expect(plan.mesocycles[0]!.workouts).toHaveLength(2);
    expect(plan.unresolvedSlots).toHaveLength(0);
    const treinoA = plan.mesocycles[0]!.workouts[0]!;
    expect(treinoA.exercises[0]!.exerciseId).toBe("e-squat-bb");
    expect(treinoA.exercises[0]!.sets).toHaveLength(3);
  });

  it("reports unresolved slots on limited equipment", () => {
    const spec = getTemplate("fullbody-hypertrophy-3x")!;
    const plan = instantiateTemplate(spec, catalog, {
      availableEquipment: ["band"],
      generateId: genId,
    });
    expect(plan.unresolvedSlots.length).toBeGreaterThan(0);
  });

  it("home gym with dumbbells resolves via fallback", () => {
    const spec = getTemplate("minimalist-health-2x")!;
    const plan = instantiateTemplate(spec, catalog, {
      availableEquipment: ["dumbbell", "bodyweight"],
      generateId: genId,
    });
    expect(plan.unresolvedSlots.length).toBeLessThanOrEqual(1); // pull_v sem cable/bodyweight assistida
    const allExercises = plan.mesocycles[0]!.workouts.flatMap((w) => w.exercises);
    expect(allExercises.length).toBeGreaterThan(6);
  });
});
