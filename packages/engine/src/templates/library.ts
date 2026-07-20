import { z } from "zod";
import { planTemplateSpecSchema, type PlanTemplateSpec } from "./types";
import rawLibrary from "./library.json";

/**
 * Templates pré-blocks usavam `workout.exercises: TemplateSlot[]`. Normaliza pra
 * `workout.blocks` com `kind: "exercise"` antes do parse, sem editar os JSONs antigos.
 */
function migrateLegacyBlocks(raw: unknown): unknown {
  if (!Array.isArray(raw)) return raw;
  return raw.map((spec) => {
    if (typeof spec !== "object" || spec === null || !("mesocycles" in spec)) return spec;
    const s = spec as { mesocycles: unknown };
    if (!Array.isArray(s.mesocycles)) return spec;
    return {
      ...s,
      mesocycles: s.mesocycles.map((meso) => {
        if (typeof meso !== "object" || meso === null || !("workouts" in meso)) return meso;
        const m = meso as { workouts: unknown };
        if (!Array.isArray(m.workouts)) return meso;
        return {
          ...m,
          workouts: m.workouts.map((workout) => {
            if (
              typeof workout !== "object" ||
              workout === null ||
              "blocks" in workout ||
              !("exercises" in workout)
            ) {
              return workout;
            }
            const w = workout as { exercises: unknown[] };
            const { exercises, ...rest } = w as { exercises: unknown[]; [k: string]: unknown };
            return {
              ...rest,
              blocks: exercises.map((slot) => ({ ...(slot as object), kind: "exercise" })),
            };
          }),
        };
      }),
    };
  });
}

/** Biblioteca validada em load — template inválido quebra no build, não em produção. */
export const templateLibrary: PlanTemplateSpec[] = z
  .array(planTemplateSpecSchema)
  .parse(migrateLegacyBlocks(rawLibrary));

export function getTemplate(id: string): PlanTemplateSpec | undefined {
  return templateLibrary.find((t) => t.id === id);
}
