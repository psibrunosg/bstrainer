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
      <div className="mx-auto max-w-lg p-4">
        <p className="text-sm text-zinc-500">Carregando…</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-4">
        <h1 className="text-2xl font-bold">Progresso</h1>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
          <p className="text-sm text-zinc-400">
            Nenhum treino registrado ainda.
          </p>
          <Link
            href="/train"
            className="mt-4 inline-block rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white"
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
      <h1 className="text-2xl font-bold">Progresso</h1>

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
            <h2 className="font-semibold">e1RM (kg)</h2>
            <select
              value={activeExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
            >
              {exerciseIds.map((id) => (
                <option key={id} value={id}>
                  {exerciseName(id)}
                </option>
              ))}
            </select>
          </div>
          <div className="h-52 rounded-xl border border-zinc-800 bg-zinc-900 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={e1rmSeries.get(activeExercise) ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: 8,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="e1rm"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="font-semibold">Tonelagem semanal (kg)</h2>
        <div className="h-52 rounded-xl border border-zinc-800 bg-zinc-900 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tonnageSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="week" stroke="#71717a" fontSize={11} />
              <YAxis stroke="#71717a" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="tonnage" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <p className="text-xs text-zinc-600">
        Dados locais deste aparelho. Sincronização com a nuvem em breve.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}
