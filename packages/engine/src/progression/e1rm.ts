/**
 * Estimativas de 1RM a partir de série submáxima.
 * e1RM é sempre derivado dos dados brutos (reps x carga), nunca armazenado como verdade.
 */

/** Epley (1985): 1RM = carga * (1 + reps/30). Padrão do sistema. */
export function e1rmEpley(loadKg: number, reps: number): number {
  if (loadKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return loadKg;
  return loadKg * (1 + reps / 30);
}

/** Brzycki (1993): 1RM = carga * 36 / (37 - reps). Confiável até ~10 reps. */
export function e1rmBrzycki(loadKg: number, reps: number): number {
  if (loadKg <= 0 || reps <= 0 || reps >= 37) return 0;
  if (reps === 1) return loadKg;
  return (loadKg * 36) / (37 - reps);
}

/**
 * Ajuste por RIR: série não levada à falha subestima o e1RM.
 * reps efetivas = reps + RIR informado (aproximação padrão da prática de RPE-based training).
 */
export function e1rmWithRir(loadKg: number, reps: number, rir: number): number {
  return e1rmEpley(loadKg, reps + Math.max(0, rir));
}

/** Arredonda carga ao incremento de placa disponível (default 2.5 kg). */
export function roundToPlate(loadKg: number, incrementKg = 2.5): number {
  if (incrementKg <= 0) return loadKg;
  return Math.round(loadKg / incrementKg) * incrementKg;
}

/** Converte %1RM em carga absoluta arredondada ao incremento. */
export function loadFromPercent(
  oneRmKg: number,
  percent: number,
  incrementKg = 2.5,
): number {
  return roundToPlate(oneRmKg * (percent / 100), incrementKg);
}
