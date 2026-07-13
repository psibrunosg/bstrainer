import { z } from "zod";
import { planTemplateSpecSchema, type PlanTemplateSpec } from "./types";
import rawLibrary from "./library.json";

/** Biblioteca validada em load — template inválido quebra no build, não em produção. */
export const templateLibrary: PlanTemplateSpec[] = z
  .array(planTemplateSpecSchema)
  .parse(rawLibrary);

export function getTemplate(id: string): PlanTemplateSpec | undefined {
  return templateLibrary.find((t) => t.id === id);
}
