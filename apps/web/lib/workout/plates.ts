/** Anilhas padrão de academia (kg), maior para menor. */
export const DEFAULT_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

export interface PlateResult {
  /** Anilhas por lado da barra, maior para menor. */
  perSide: number[];
  /** Peso que sobra e não fecha com as anilhas disponíveis. */
  leftover: number;
  barKg: number;
}

/**
 * Calcula anilhas por lado para atingir o peso alvo.
 * Assume barra simétrica; sobra o que não fechar com as anilhas.
 */
export function calcPlates(
  targetKg: number,
  barKg = 20,
  plates: number[] = DEFAULT_PLATES,
): PlateResult {
  const perSide: number[] = [];
  let perSideTarget = (targetKg - barKg) / 2;
  if (perSideTarget < 0) {
    return { perSide, leftover: targetKg, barKg };
  }
  let remaining = perSideTarget;
  for (const plate of plates) {
    while (remaining >= plate - 1e-9) {
      perSide.push(plate);
      remaining -= plate;
    }
  }
  return { perSide, leftover: Math.round(remaining * 2 * 100) / 100, barKg };
}
