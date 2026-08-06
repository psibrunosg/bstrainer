import { describe, it, expect } from "vitest";
import {
  calculateDeterministicProgression,
  type ProgressionEngineInput,
} from "./deterministic-engine";

describe("calculateDeterministicProgression - Engine Determinística", () => {
  it("sugere acréscimo de carga (5%) após 2 treinos seguidos no topo das reps com RIR >= 2", () => {
    const input: ProgressionEngineInput = {
      currentLoad: 60,
      currentReps: 12,
      targetRepsMin: 8,
      targetRepsMax: 12,
      stepLoadKg: 2.5,
      recentSessions: [
        { load: 60, reps: 12, rir: 2 }, // Sessão mais recente
        { load: 60, reps: 12, rir: 3 }, // Sessão penúltima
      ],
    };

    const result = calculateDeterministicProgression(input);

    expect(result.action).toBe("increase_load");
    expect(result.suggestedLoad).toBe(63); // 60 + (60 * 0.05) = 63 -> Math.round(63/0.5)*0.5 = 63
    expect(result.suggestedReps).toBe(8); // Reinicia as reps na base da faixa
    expect(result.ruleCode).toBe("DOUBLE_PROGRESSION_TOP");
    expect(result.explanation).toContain("DOUBLE_PROGRESSION_TOP");
  });

  it("sugere progredir +1 repetição quando ainda não alcançou o topo da faixa", () => {
    const input: ProgressionEngineInput = {
      currentLoad: 50,
      currentReps: 9,
      targetRepsMin: 8,
      targetRepsMax: 12,
      recentSessions: [
        { load: 50, reps: 9, rir: 1 },
      ],
    };

    const result = calculateDeterministicProgression(input);

    expect(result.action).toBe("increase_reps");
    expect(result.suggestedLoad).toBe(50);
    expect(result.suggestedReps).toBe(10);
    expect(result.ruleCode).toBe("VOLUME_PROGRESSION");
  });

  it("sugere deload (-15%) após 2 treinos seguidos falhando abaixo das reps mínimas com esforço máximo (RIR 0 / RPE 9.5+)", () => {
    const input: ProgressionEngineInput = {
      currentLoad: 100,
      currentReps: 6,
      targetRepsMin: 8,
      targetRepsMax: 12,
      recentSessions: [
        { load: 100, reps: 6, rir: 0, rpe: 10 },
        { load: 100, reps: 7, rir: 0, rpe: 9.5 },
      ],
    };

    const result = calculateDeterministicProgression(input);

    expect(result.action).toBe("deload");
    expect(result.suggestedLoad).toBe(85); // 100 * 0.85 = 85
    expect(result.suggestedReps).toBe(8);
    expect(result.ruleCode).toBe("PERSISTENT_FATIGUE_DELOAD");
  });

  it("encaminha para revisão profissional quando atleta relata dor/fadiga máxima (5)", () => {
    const input: ProgressionEngineInput = {
      currentLoad: 80,
      currentReps: 8,
      targetRepsMin: 8,
      targetRepsMax: 12,
      recentSessions: [
        { load: 80, reps: 8, soreness: 5 },
      ],
    };

    const result = calculateDeterministicProgression(input);

    expect(result.action).toBe("refer_professional");
    expect(result.suggestedLoad).toBe(64); // redução de 20%
    expect(result.ruleCode).toBe("PAIN_REFERRAL");
    expect(result.badgeLabel).toContain("Consultar Personal");
  });

  it("sugere manutenção de carga para estabilização no fallback padrão", () => {
    const input: ProgressionEngineInput = {
      currentLoad: 70,
      currentReps: 12,
      targetRepsMin: 8,
      targetRepsMax: 12,
      recentSessions: [
        { load: 70, reps: 12, rir: 1 }, // Apenas 1 sessão ou RIR < 2
      ],
    };

    const result = calculateDeterministicProgression(input);

    expect(result.action).toBe("maintain");
    expect(result.suggestedLoad).toBe(70);
    expect(result.suggestedReps).toBe(12);
    expect(result.ruleCode).toBe("MAINTENANCE");
  });
});
