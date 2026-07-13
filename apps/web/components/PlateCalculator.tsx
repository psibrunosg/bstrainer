"use client";

import { useMemo, useState } from "react";
import { calcPlates } from "@/lib/workout/plates";

function formatKg(kg: number): string {
  return kg % 1 === 0 ? String(kg) : kg.toFixed(2).replace(/\.?0+$/, "").replace(".", ",");
}

/** Bottom-sheet: dado peso alvo e barra, mostra anilhas por lado. */
export function PlateCalculator({
  targetKg,
  onClose,
}: {
  targetKg: number;
  onClose: () => void;
}) {
  const [barKg, setBarKg] = useState(20);
  const result = useMemo(() => calcPlates(targetKg, barKg), [targetKg, barKg]);

  const grouped = useMemo(() => {
    const map = new Map<number, number>();
    for (const p of result.perSide) map.set(p, (map.get(p) ?? 0) + 1);
    return [...map.entries()];
  }, [result]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg space-y-4 rounded-lg border border-line bg-surface p-5 shadow-[0_-8px_32px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-semibold">Anilhas</h2>
          <span className="tnum font-display text-2xl font-bold text-signal">
            {formatKg(targetKg)} kg
          </span>
        </div>

        <div className="flex gap-2">
          {[20, 15, 10].map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBarKg(b)}
              className={`h-10 flex-1 rounded border text-sm font-semibold transition ${
                barKg === b
                  ? "border-signal bg-signal/10 text-signal"
                  : "border-line bg-ink text-mute"
              }`}
            >
              Barra {b}kg
            </button>
          ))}
        </div>

        {result.perSide.length === 0 ? (
          <p className="rounded border border-line bg-ink px-4 py-6 text-center text-sm text-mute">
            {targetKg <= barKg
              ? "Peso alvo menor ou igual à barra."
              : "Nenhuma anilha padrão fecha esse peso."}
          </p>
        ) : (
          <div className="space-y-2">
            <p className="caps-label text-mute">Por lado</p>
            <div className="flex flex-wrap gap-2">
              {grouped.map(([plate, count]) => (
                <span
                  key={plate}
                  className="tnum flex h-11 items-center gap-1.5 rounded border border-line bg-ink px-3 font-display text-base font-semibold"
                >
                  {count}× <span className="text-signal">{formatKg(plate)}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {result.leftover > 0 && (
          <p className="text-xs text-mute">
            Sobra {formatKg(result.leftover)} kg (não fecha com anilhas padrão).
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="h-12 w-full rounded-lg border border-line bg-ink text-[15px] font-semibold text-text transition active:bg-surface-2"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
