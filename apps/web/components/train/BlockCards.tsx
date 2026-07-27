"use client";

import type { PerformedActivity, PerformedCircuit, WorkoutBlock } from "@bstrainer/domain";

export function ActivityBlockCard({
  activity,
  prescribed,
  name,
  onChange,
}: {
  activity: PerformedActivity;
  prescribed?: WorkoutBlock;
  name?: string;
  onChange: (patch: { durationSeconds: number | null }) => void;
}) {
  const target = prescribed?.kind === "activity" ? prescribed : undefined;
  const minutes = activity.durationSeconds != null ? Math.round(activity.durationSeconds / 60) : null;
  return (
    <section className="space-y-3 rounded-lg border border-line bg-surface p-4">
      <h2 className="font-display text-lg font-semibold">{name ?? "Atividade"}</h2>
      {target && (
        <p className="text-xs text-mute">
          Meta:{target.durationSeconds ? ` ${Math.round(target.durationSeconds / 60)}min` : ""}
          {target.distanceKm ? ` ${target.distanceKm}km` : ""}
          {target.targetRpe ? ` · RPE ${target.targetRpe}` : ""}
          {target.notes ? ` — ${target.notes}` : ""}
        </p>
      )}
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          placeholder="min"
          value={minutes ?? ""}
          onChange={(e) =>
            onChange({
              durationSeconds: e.target.value ? Number(e.target.value) * 60 : null,
            })
          }
          aria-label="Duração em minutos"
          className="tnum h-11 w-24 rounded border border-line bg-ink px-3 text-center font-display text-lg font-semibold outline-none focus:border-signal"
        />
        <span className="text-sm text-mute">min realizados</span>
      </div>
    </section>
  );
}

export function CircuitBlockCard({
  circuit,
  prescribed,
  onChange,
}: {
  circuit: PerformedCircuit;
  prescribed?: WorkoutBlock;
  onChange: (patch: { roundsCompleted: number }) => void;
}) {
  const target = prescribed?.kind === "circuit" ? prescribed : undefined;
  return (
    <section className="space-y-3 rounded-lg border border-line bg-surface p-4">
      <h2 className="font-display text-lg font-semibold">Circuito</h2>
      {target && (
        <p className="text-xs text-mute">
          Meta: {target.rounds}× {target.workSeconds}s/{target.restSeconds}s
          {target.notes ? ` — ${target.notes}` : ""}
        </p>
      )}
      <div className="flex items-center gap-2">
        <span className="text-sm text-mute">Rounds completos</span>
        <input
          type="number"
          inputMode="numeric"
          value={circuit.roundsCompleted}
          onChange={(e) => onChange({ roundsCompleted: Number(e.target.value) || 0 })}
          aria-label="Rounds completos"
          className="tnum h-11 w-16 rounded border border-line bg-ink text-center font-display text-lg font-semibold outline-none focus:border-signal"
        />
      </div>
    </section>
  );
}
