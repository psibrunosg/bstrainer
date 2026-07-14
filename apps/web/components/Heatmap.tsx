"use client";

import type { HeatmapCell } from "@bstrainer/engine";

/** Heatmap de frequência (estilo GitHub). Colunas = semanas, linhas = dias. */
export function Heatmap({ cells }: { cells: HeatmapCell[] }) {
  // Agrupa em colunas de 7 (semana começando no primeiro dia da série)
  const weeks: HeatmapCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  function tone(count: number): string {
    if (count <= 0) return "bg-surface-2";
    if (count === 1) return "bg-signal/40";
    return "bg-signal";
  }

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((cell) => (
            <div
              key={cell.date}
              title={`${cell.date}: ${cell.count} treino${cell.count === 1 ? "" : "s"}`}
              className={`h-3 w-3 rounded-[2px] ${tone(cell.count)}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
