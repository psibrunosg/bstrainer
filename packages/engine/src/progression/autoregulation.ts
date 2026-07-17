import type { Readiness } from "@bstrainer/domain";

export type AutoregulationRecommendation = "deload" | "maintain" | "progress";

export interface AutoregulationInput {
  readiness: Readiness | null;
  lastSessionRpe: number | null;
  recentE1rmTrend: "up" | "flat" | "down" | null;
}

export interface AutoregulationSuggestion {
  recommendation: AutoregulationRecommendation;
  loadMultiplier: number;
  reason: string;
}

function readinessAverage(readiness: Readiness | null): number | null {
  if (readiness == null) return null;
  const values = [readiness.sleep, readiness.soreness, readiness.energy].filter(
    (v): v is number => v != null,
  );
  if (values.length < 2) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Ajuste de carga por autorregulação — regra determinística e pontuada (não LLM).
 * ponytail: camada "AI-adaptive" do roadmap; upgrade path é trocar por chamada LLM
 * para explicações em linguagem natural quando houver provider key configurado.
 */
export function suggestAdjustment(input: AutoregulationInput): AutoregulationSuggestion {
  const avgReadiness = readinessAverage(input.readiness);
  if (avgReadiness != null && avgReadiness <= 2) {
    return {
      recommendation: "deload",
      loadMultiplier: 0.6,
      reason: "Prontidão baixa nos últimos registros — reduzir carga para recuperar.",
    };
  }

  if (input.lastSessionRpe != null && input.lastSessionRpe >= 9 && input.recentE1rmTrend === "down") {
    return {
      recommendation: "deload",
      loadMultiplier: 0.8,
      reason: "Fadiga alta na última sessão combinada com queda de força — deload recomendado.",
    };
  }

  if (
    input.recentE1rmTrend === "up" &&
    (input.lastSessionRpe == null || input.lastSessionRpe <= 7)
  ) {
    return {
      recommendation: "progress",
      loadMultiplier: 1.05,
      reason: "Tendência de força em alta com esforço controlado — progredir carga.",
    };
  }

  return {
    recommendation: "maintain",
    loadMultiplier: 1.0,
    reason: "Sem sinal claro de ajuste — manter carga atual.",
  };
}
