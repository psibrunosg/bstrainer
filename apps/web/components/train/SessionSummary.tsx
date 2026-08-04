"use client";

import { useState } from "react";
import { isPerformedExercise, type WorkoutSession } from "@bstrainer/domain";
import { sessionTonnage } from "@bstrainer/engine";
import { exerciseName } from "@/lib/workout/exercises";
import { shareOrDownloadCard } from "@/lib/workout/share-card";
import { formatKg } from "@/lib/workout/exercise-utils";

export function SessionSummary({
  session,
  prCount,
  onBack,
  nameOverrides = {},
}: {
  session: WorkoutSession;
  prCount: number;
  onBack: () => void;
  nameOverrides?: Record<string, { name: string; mediaUrl: string | null }>;
}) {
  const [sharing, setSharing] = useState(false);

  const durationMin = Math.max(
    1,
    Math.round(
      (Date.parse(session.finishedAt ?? session.startedAt) -
        Date.parse(session.startedAt)) /
        60_000,
    ),
  );
  const finishedExercises = session.blocks.filter(isPerformedExercise);
  const totalSets = finishedExercises.reduce(
    (acc, e) => acc + e.sets.length,
    0,
  );

  async function handleShare() {
    setSharing(true);
    try {
      await shareOrDownloadCard(session, prCount);
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-6">
      <h1 className="font-display text-[28px] font-extrabold uppercase tracking-tight">
        Treino concluído
      </h1>
      {prCount > 0 && (
        <div className="animate-pr-pop rounded-lg border border-gold/30 bg-gold/10 px-4 py-3">
          <p className="font-display font-semibold text-gold">
            {prCount} novo{prCount > 1 ? "s" : ""} recorde
            {prCount > 1 ? "s" : ""} hoje
          </p>
        </div>
      )}
      <div className="grid grid-cols-3 gap-3">
        <Stat value={String(durationMin)} label="min" />
        <Stat value={formatKg(sessionTonnage(session))} label="kg total" />
        <Stat value={String(totalSets)} label="séries" />
      </div>
      <ul className="space-y-px">
        {finishedExercises.map((e) => (
          <li
            key={e.id}
            className="flex items-center justify-between border-b border-line px-1 py-3 text-sm"
          >
            <span className="text-text">
              {nameOverrides[e.exerciseId]?.name ?? exerciseName(e.exerciseId)}
            </span>
            <span className="tnum text-mute">{e.sets.length} séries</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={sharing}
        onClick={handleShare}
        className="h-12 w-full rounded-lg border border-line bg-surface text-[15px] font-semibold text-text transition active:bg-surface-2 disabled:opacity-50"
      >
        {sharing ? "Gerando…" : "Compartilhar treino"}
      </button>
      <button
        type="button"
        onClick={onBack}
        className="h-12 w-full rounded-lg bg-signal text-[15px] font-semibold text-ink transition active:scale-[0.98] active:bg-signal-press"
      >
        Voltar para Treinar
      </button>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 text-center">
      <p className="tnum font-display text-2xl font-bold">{value}</p>
      <p className="caps-label mt-0.5 text-mute">{label}</p>
    </div>
  );
}
