import type { AthleteProfile } from "@bstrainer/domain";
import type { PlanTemplateSpec } from "../templates/types";

const GOAL_LABELS: Record<string, string> = {
  hypertrophy: "hipertrofia",
  strength: "força",
  power: "potência",
  endurance: "resistência",
  health: "saúde",
  fat_loss: "emagrecimento",
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "iniciante",
  intermediate: "intermediário",
  advanced: "avançado",
};

const ADJACENT_LEVELS: Record<string, string[]> = {
  beginner: ["intermediate"],
  intermediate: ["beginner", "advanced"],
  advanced: ["intermediate"],
};

/**
 * Recomendação de template por score aditivo (regra determinística, sem LLM).
 * ponytail: camada "AI-adaptive" do roadmap é regra pontuada, não modelo — upgrade path
 * é plugar uma chamada LLM aqui para gerar as `reasons` em linguagem natural quando
 * houver provider key configurado.
 */
export function recommendTemplate(
  profile: AthleteProfile,
  templates: PlanTemplateSpec[],
): { template: PlanTemplateSpec; score: number; reasons: string[] } | null {
  if (templates.length === 0) return null;

  let best: { template: PlanTemplateSpec; score: number; reasons: string[] } | null = null;

  for (const template of templates) {
    let score = 0;
    const reasons: string[] = [];

    if (template.goal === profile.goal) {
      score += 3;
      reasons.push(`Objetivo bate: ${GOAL_LABELS[template.goal] ?? template.goal}`);
    }

    if (template.level === profile.level) {
      score += 2;
      reasons.push(`Nível compatível: ${LEVEL_LABELS[template.level] ?? template.level}`);
    } else if (ADJACENT_LEVELS[profile.level]?.includes(template.level)) {
      score += 1;
      reasons.push(`Nível próximo: ${LEVEL_LABELS[template.level] ?? template.level}`);
    }

    const dayDiff = Math.abs(template.daysPerWeek - profile.daysPerWeek);
    score -= dayDiff;
    if (dayDiff === 0) {
      reasons.push(`Frequência ideal: ${template.daysPerWeek}x/semana`);
    }

    if (best === null || score > best.score) {
      best = { template, score, reasons };
    }
  }

  return best;
}
