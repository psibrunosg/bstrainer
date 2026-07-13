"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WorkoutSession } from "@bstrainer/domain";
import { e1rmWithRir, e1rmEpley, sessionTonnage } from "@bstrainer/engine";
import { loadSessionHistory } from "@/lib/workout/storage";
import { exerciseName } from "@/lib/workout/exercises";

const CHART_SIGNAL = "#FF4D00";
const CHART_LINE = "#2E2924";
const CHART_MUTE = "#8A817A";
const CHART_SURFACE = "#171412";

interface E1rmPoint {
  date: string;
  e1rm: number;
}

function bestE1rmByExercise(
  sessions: WorkoutSession[],
): Map<string, E1rmPoint[]> {
  const byExercise = new Map<string, Map<string, number>>();
  for (const s of sessions) {
    const day = s.startedAt.slice(0, 10);
    for (const ex of s.exercises) {
      for (const set of ex.sets) {
        if (set.isWarmup || set.loadKg == null || set.reps <= 0) continue;
        const e1rm =
          set.rir != null
            ? e1rmWithRir(set.loadKg, set.reps, set.rir)
            : e1rmEpley(set.loadKg, set.reps);
        const days = byExercise.get(ex.exerciseId) ?? new Map();
        days.set(day, Math.max(days.get(day) ?? 0, e1rm));
        byExercise.set(ex.exerciseId, days);
      }
    }
  }
  const result = new Map<string, E1rmPoint[]>();
  for (const [exId, days] of byExercise) {
    result.set(
      exId,
      [...days.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, e1rm]) => ({ date: date.slice(5), e1rm: Math.round(e1rm * 10) / 10 })),
    );
  }
  return result;
}

function weeklyTonnage(sessions: WorkoutSession[]) {
  const weeks = new Map<string, number>();
  for (const s of sessions) {
    const d = new Date(s.startedAt);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    weeks.set(key, (weeks.get(key) ?? 0) + sessionTonnage(s));
  }
  return [...weeks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, tonnage]) => ({ week: week.slice(5), tonnage: Math.round(tonnage) }));
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  useEffect(() => {
    setSessions(loadSessionHistory().filter((s) => s.status === "completed"));
    setLoaded(true);
  }, []);

  const e1rmSeries = useMemo(() => bestE1rmByExercise(sessions), [sessions]);
  const tonnageSeries = useMemo(() => weeklyTonnage(sessions), [sessions]);

  const exerciseIds = [...e1rmSeries.keys()];
  const activeExercise =
    selectedExercise && e1rmSeries.has(selectedExercise)
      ? selectedExercise
      : exerciseIds[0] ?? null;

  if (!loaded) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-4">
        <div className="h-8 w-40 animate-pulse rounded bg-surface-2" />
        <div className="h-52 animate-pulse rounded-lg bg-surface-2" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-4">
        <h1 className="font-display text-[28px] font-extrabold uppercase tracking-tight">
          Progresso
        </h1>
        <div className="rounded-lg border border-line bg-surface p-6 text-center">
          <p className="text-sm text-mute">Nenhum treino registrado ainda.</p>
          <Link
            href="/train"
            className="mt-4 inline-flex h-12 items-center justify-center rounded-lg bg-signal px-6 text-[15px] font-semibold text-ink transition active:scale-[0.98] active:bg-signal-press"
          >
            Registrar primeiro treino
          </Link>
        </div>
      </div>
    );
  }

  const totalSets = sessions.reduce(
    (acc, s) =>
      acc +
      s.exercises.reduce(
        (a, ex) => a + ex.sets.filter((st) => !st.isWarmup).length,
        0,
      ),
    0,
  );

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      <h1 className="font-display text-[28px] font-extrabold uppercase tracking-tight">
        Progresso
      </h1>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Treinos" value={String(sessions.length)} />
        <Stat label="Séries" value={String(totalSets)} />
        <Stat
          label="Tonelagem"
          value={`${Math.round(sessions.reduce((a, s) => a + sessionTonnage(s), 0) / 1000)}t`}
        />
      </div>

      {activeExercise && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="caps-label font-display font-semibold text-mute">
              e1RM (kg)
            </h2>
            <select
              value={activeExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="rounded border border-line bg-surface px-2 py-1 text-sm text-text outline-none focus:border-signal"
            >
              {exerciseIds.map((id) => (
                <option key={id} value={id}>
                  {exerciseName(id)}
                </option>
              ))}
            </select>
          </div>
          <div className="h-52 rounded-lg border border-line bg-surface p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={e1rmSeries.get(activeExercise) ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_LINE} />
                <XAxis dataKey="date" stroke={CHART_MUTE} fontSize={11} />
                <YAxis stroke={CHART_MUTE} fontSize={11} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    background: CHART_SURFACE,
                    border: `1px solid ${CHART_LINE}`,
                    borderRadius: 8,
                    color: "#F5F2EE",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="e1rm"
                  stroke={CHART_SIGNAL}
                  strokeWidth={2}
                  dot={{ r: 3, fill: CHART_SIGNAL, stroke: CHART_SIGNAL }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="caps-label font-display font-semibold text-mute">
          Tonelagem semanal (kg)
        </h2>
        <div className="h-52 rounded-lg border border-line bg-surface p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tonnageSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_LINE} />
              <XAxis dataKey="week" stroke={CHART_MUTE} fontSize={11} />
              <YAxis stroke={CHART_MUTE} fontSize={11} />
              <Tooltip
                cursor={{ fill: "rgba(255,77,0,0.08)" }}
                contentStyle={{
                  background: CHART_SURFACE,
                  border: `1px solid ${CHART_LINE}`,
                  borderRadius: 8,
                  color: "#F5F2EE",
                }}
              />
              <Bar dataKey="tonnage" fill={CHART_SIGNAL} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <p className="text-xs text-mute">
        Dados locais deste aparelho. Sincronização com a nuvem em breve.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 text-center">
      <p className="tnum font-display text-xl font-bold text-text">{value}</p>
      <p className="caps-label mt-1 text-mute">{label}</p>
    </div>
  );
}
