export type ProgressionAction =
  | "increase_load"
  | "increase_reps"
  | "deload"
  | "refer_professional"
  | "maintain";

export interface ProgressionSuggestion {
  action: ProgressionAction;
  suggestedLoad: number;
  suggestedReps: number;
  ruleCode: string;
  explanation: string;
  badgeLabel: string;
}

export interface ExerciseSessionRecord {
  load: number;
  reps: number;
  rir?: number | null;
  rpe?: number | null;
  soreness?: number | null;
}

export interface ProgressionEngineInput {
  currentLoad: number;
  currentReps: number;
  targetRepsMin: number;
  targetRepsMax: number;
  /** Lista das últimas sessões realizadas para este exercício (índice 0 = mais recente, índice 1 = penúltima) */
  recentSessions: ExerciseSessionRecord[];
  /** Incremento mínimo de peso em kg (ex: 2.5) */
  stepLoadKg?: number;
}

/**
 * Motor determinístico e explicável de progressão de carga e volume.
 * Gera recomendações calculadas matematicamente a partir de regras formais (sem caixas-pretas de IA).
 */
export function calculateDeterministicProgression(
  input: ProgressionEngineInput
): ProgressionSuggestion {
  const {
    currentLoad,
    currentReps,
    targetRepsMin,
    targetRepsMax,
    recentSessions,
    stepLoadKg = 2.5,
  } = input;

  const s0 = recentSessions[0];
  const s1 = recentSessions[1];

  // Regra 1: Encaminhamento Profissional / Dor Extrema ou Queda Persistente (PAIN_REFERRAL)
  if (s0 && (s0.soreness === 5 || (s0.soreness !== undefined && s0.soreness !== null && s0.soreness >= 4 && s1 && s1.soreness !== undefined && s1.soreness !== null && s1.soreness >= 4))) {
    const reducedLoad = Math.max(0, Math.round((currentLoad * 0.8) / 0.5) * 0.5);
    return {
      action: "refer_professional",
      suggestedLoad: reducedLoad,
      suggestedReps: targetRepsMin,
      ruleCode: "PAIN_REFERRAL",
      badgeLabel: "⚠️ Consultar Personal (Fadiga/Dor Elevada)",
      explanation:
        "Regra determinística [PAIN_REFERRAL]: Nível de dor/fadiga extrema relatada na última sessão ou fadiga persistentemente elevada (≥4/5) nos últimos 2 treinos. Recomendamos redução preventiva de 20% na carga e avaliação com o treinador.",
    };
  }

  // Regra 2: Deload Automático por Fadiga ou Falha Persistente (PERSISTENT_FATIGUE_DELOAD)
  if (s0 && s1) {
    const s0Exhausted = (s0.rir === 0 || (s0.rpe !== null && s0.rpe !== undefined && s0.rpe >= 9.5)) && s0.reps < targetRepsMin;
    const s1Exhausted = (s1.rir === 0 || (s1.rpe !== null && s1.rpe !== undefined && s1.rpe >= 9.5)) && s1.reps < targetRepsMin;
    
    if (s0Exhausted && s1Exhausted) {
      const deloadLoad = Math.max(0, Math.round((currentLoad * 0.85) / 0.5) * 0.5);
      return {
        action: "deload",
        suggestedLoad: deloadLoad,
        suggestedReps: targetRepsMin,
        ruleCode: "PERSISTENT_FATIGUE_DELOAD",
        badgeLabel: "🛡️ Deload Automático (-15% Carga)",
        explanation:
          "Regra determinística [PERSISTENT_FATIGUE_DELOAD]: Esforço máximo alcançado sem atingir a meta mínima de repetições por 2 treinos consecutivos (RIR 0 / RPE ≥ 9.5). Recomendado deload regenerativo de 15%.",
      };
    }
  }

  // Regra 3: Duplo Progresso no Topo com RIR ≥ 2 (DOUBLE_PROGRESSION_TOP)
  if (s0 && s1) {
    const s0Top = s0.reps >= targetRepsMax && (s0.rir === null || s0.rir === undefined || s0.rir >= 2);
    const s1Top = s1.reps >= targetRepsMax && (s1.rir === null || s1.rir === undefined || s1.rir >= 2);

    if (s0Top && s1Top) {
      let increase = currentLoad * 0.05;
      if (increase < stepLoadKg && currentLoad > 0) {
        increase = stepLoadKg;
      }
      const newLoad = Math.round((currentLoad + increase) / 0.5) * 0.5;

      return {
        action: "increase_load",
        suggestedLoad: newLoad,
        suggestedReps: targetRepsMin,
        ruleCode: "DOUBLE_PROGRESSION_TOP",
        badgeLabel: "📈 +5% Carga (2x Topo das Reps com RIR ≥ 2)",
        explanation: `Regra determinística [DOUBLE_PROGRESSION_TOP]: Você alcançou o topo da faixa de repetições (≥${targetRepsMax}) com margem de reserva (RIR ≥ 2) em 2 sessões seguidas. Carga elevada e repetições reiniciadas na base da faixa (${targetRepsMin} reps).`,
      };
    }
  }

  // Regra 4: Progressão de Repetições Rumo ao Topo (VOLUME_PROGRESSION)
  if (currentReps < targetRepsMax && currentLoad > 0) {
    const newReps = Math.min(currentReps + 1, targetRepsMax);
    return {
      action: "increase_reps",
      suggestedLoad: currentLoad,
      suggestedReps: newReps,
      ruleCode: "VOLUME_PROGRESSION",
      badgeLabel: `🔄 +1 Repetição (Rumo aos ${targetRepsMax} reps)`,
      explanation: `Regra determinística [VOLUME_PROGRESSION]: Você realizou ${currentReps} repetições na última sessão. A recomendação é manter a carga de ${currentLoad} kg e adicionar +1 repetição rumo ao topo da faixa (${targetRepsMin}-${targetRepsMax} reps).`,
    };
  }

  // Regra 5: Estabilização / Manutenção da Carga (MAINTENANCE)
  return {
    action: "maintain",
    suggestedLoad: currentLoad,
    suggestedReps: currentReps,
    ruleCode: "MAINTENANCE",
    badgeLabel: "⚖️ Manter Carga (Estabilização)",
    explanation:
      "Regra determinística [MAINTENANCE]: Manter a carga e volume atuais para consolidação da adaptação neuromuscular e técnica na faixa prescrita.",
  };
}
