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
import type { AthleteProfile } from "@bstrainer/domain";
import type { WorkoutSession } from "@bstrainer/domain";
import {
  buildBadgeContext,
  computeStrengthScore,
  computeXp,
  e1rmWithRir,
  e1rmEpley,
  evaluateBadges,
  frequencyHeatmap,
  sessionTonnage,
  weeklyStreak,
} from "@bstrainer/engine";
import { loadSessions } from "@/lib/data/sessions";
import { loadExerciseNames } from "@/lib/data/exercise-names";
import { getMyAthleteProfile } from "@/lib/data/athlete";
import {
  createGoal,
  deleteGoal,
  listGoals,
  type Goal,
  type GoalKind,
} from "@/lib/data/goals";
import { EXERCISES, exerciseName as localName } from "@/lib/workout/exercises";
import { Heatmap } from "@/components/Heatmap";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const CHART_SIGNAL = "#FF4D00";
const CHART_LINE = "#2E2924";
const CHART_MUTE = "#8A817A";
const CHART_SURFACE = "#171412";

interface E1rmPoint {
  date: string;
  e1rm: number;
}

function bestE1rmByExercise(sessions: WorkoutSession[]): Map<string, E1rmPoint[]> {
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
        .map(([date, e1rm]) => ({
          date: date.slice(5),
          e1rm: Math.round(e1rm * 10) / 10,
        })),
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
  const [nameOf, setNameOf] = useState<(id: string) => string>(() => localName);
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [addingGoal, setAddingGoal] = useState(false);
  const [goalKind, setGoalKind] = useState<GoalKind>("exercise_1rm");
  const [goalExerciseId, setGoalExerciseId] = useState(EXERCISES[0]?.id ?? "");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalPending, setGoalPending] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions().then((s) => {
      setSessions(s);
      setLoaded(true);
    });
    loadExerciseNames().then((fn) => setNameOf(() => fn));
    getMyAthleteProfile().then(setProfile);
    listGoals().then(setGoals);
  }, []);

  const e1rmSeries = useMemo(() => bestE1rmByExercise(sessions), [sessions]);
  const tonnageSeries = useMemo(() => weeklyTonnage(sessions), [sessions]);
  const streak = useMemo(() => weeklyStreak(sessions), [sessions]);
  const heatmap = useMemo(() => frequencyHeatmap(sessions, 91), [sessions]);
  const bestE1rmMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [id, points] of e1rmSeries) {
      map[id] = Math.max(...points.map((p) => p.e1rm));
    }
    return map;
  }, [e1rmSeries]);
  const strengthScore = useMemo(
    () => computeStrengthScore(bestE1rmMap, profile?.weightKg ?? null),
    [bestE1rmMap, profile],
  );
  const xpResult = useMemo(() => computeXp(sessions), [sessions]);
  const badges = useMemo(
    () => evaluateBadges(buildBadgeContext(sessions, streak)),
    [sessions, streak],
  );
  const sessionsThisWeek = useMemo(() => {
    const cutoff = Date.now() - WEEK_MS;
    return sessions.filter((s) => Date.parse(s.startedAt) >= cutoff).length;
  }, [sessions]);

  async function submitGoal() {
    const target = Number(goalTarget.replace(",", "."));
    if (!Number.isFinite(target) || target <= 0) {
      setGoalError("Informe um valor válido.");
      return;
    }
    setGoalPending(true);
    setGoalError(null);
    const result = await createGoal({
      kind: goalKind,
      exerciseId: goalKind === "exercise_1rm" ? goalExerciseId : null,
      targetValue: target,
    });
    setGoalPending(false);
    if (!result.ok) {
      setGoalError(result.error ?? "Falha ao criar meta.");
      return;
    }
    setGoalTarget("");
    setAddingGoal(false);
    listGoals().then(setGoals);
  }

  async function removeGoal(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    await deleteGoal(id);
  }

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
      acc + s.exercises.reduce((a, ex) => a + ex.sets.filter((st) => !st.isWarmup).length, 0),
    0,
  );

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      <h1 className="font-display text-[28px] font-extrabold uppercase tracking-tight">
        Progresso
      </h1>

      <div className="grid grid-cols-4 gap-3">
        <Stat label="Treinos" value={String(sessions.length)} />
        <Stat label="Séries" value={String(totalSets)} />
        <Stat
          label="Tonelagem"
          value={`${Math.round(sessions.reduce((a, s) => a + sessionTonnage(s), 0) / 1000)}t`}
        />
        <Stat label="Sequência" value={`${streak}sem`} accent={streak > 0} />
      </div>

      <section className="space-y-2 rounded-lg border border-line bg-surface p-4">
        <div className="flex items-center justify-between">
          <span className="caps-label font-display font-semibold text-mute">
            Nível {xpResult.level}
          </span>
          <span className="tnum text-xs text-mute">
            {xpResult.xpIntoLevel}/{xpResult.xpForNextLevel} XP
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-signal transition-all"
            style={{
              width: `${Math.min(100, (xpResult.xpIntoLevel / xpResult.xpForNextLevel) * 100)}%`,
            }}
          />
        </div>
      </section>

      {strengthScore.overall != null && (
        <section className="space-y-2 rounded-lg border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="caps-label font-display font-semibold text-mute">
              Strength Score
            </span>
            <span className="tnum font-display text-2xl font-bold text-signal">
              {strengthScore.overall}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {strengthScore.lifts.map((l) => (
              <span
                key={l.key}
                className="rounded-full border border-line bg-ink px-2.5 py-1 text-[11px] text-mute"
              >
                {l.key}: {l.score}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="caps-label font-display font-semibold text-mute">
          Conquistas
        </h2>
        <div className="flex flex-wrap gap-2">
          {badges.map((b) => (
            <span
              key={b.key}
              title={b.description}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                b.earned
                  ? "border-signal/30 bg-signal/10 text-signal"
                  : "border-line bg-ink text-mute opacity-50"
              }`}
            >
              {b.label}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="caps-label font-display font-semibold text-mute">
            Metas
          </h2>
          <button
            type="button"
            onClick={() => setAddingGoal((v) => !v)}
            className="text-xs font-semibold text-signal"
          >
            {addingGoal ? "Cancelar" : "+ Meta"}
          </button>
        </div>

        {addingGoal && (
          <div className="space-y-2 rounded-lg border border-line bg-surface p-3">
            <select
              value={goalKind}
              onChange={(e) => setGoalKind(e.target.value as GoalKind)}
              className="h-10 w-full rounded border border-line bg-ink px-2 text-sm outline-none focus:border-signal"
            >
              <option value="exercise_1rm">Peso-alvo num exercício</option>
              <option value="weekly_frequency">Frequência semanal</option>
            </select>
            {goalKind === "exercise_1rm" && (
              <select
                value={goalExerciseId}
                onChange={(e) => setGoalExerciseId(e.target.value)}
                className="h-10 w-full rounded border border-line bg-ink px-2 text-sm outline-none focus:border-signal"
              >
                {EXERCISES.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            )}
            <input
              type="text"
              inputMode="decimal"
              placeholder={goalKind === "exercise_1rm" ? "Meta em kg" : "Treinos por semana"}
              value={goalTarget}
              onChange={(e) => setGoalTarget(e.target.value)}
              className="h-10 w-full rounded border border-line bg-ink px-3 text-sm outline-none placeholder:text-mute focus:border-signal"
            />
            {goalError && <p className="text-sm text-err">{goalError}</p>}
            <button
              type="button"
              onClick={submitGoal}
              disabled={goalPending}
              className="h-10 w-full rounded-lg bg-signal text-sm font-semibold text-ink transition active:scale-[0.98] disabled:opacity-50"
            >
              {goalPending ? "Salvando…" : "Criar meta"}
            </button>
          </div>
        )}

        {goals.length === 0 && !addingGoal && (
          <p className="text-sm text-mute">Nenhuma meta definida ainda.</p>
        )}

        {goals.map((g) => {
          const current =
            g.kind === "exercise_1rm"
              ? (g.exerciseId ? bestE1rmMap[g.exerciseId] ?? 0 : 0)
              : sessionsThisWeek;
          const pct = Math.min(100, Math.round((current / g.targetValue) * 100));
          const label =
            g.kind === "exercise_1rm"
              ? `${g.exerciseName ?? nameOf(g.exerciseId ?? "")}: ${current}/${g.targetValue}kg`
              : `Frequência: ${current}/${g.targetValue}x essa semana`;
          return (
            <div
              key={g.id}
              className="space-y-1.5 rounded-lg border border-line bg-surface p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm">{label}</span>
                <button
                  type="button"
                  onClick={() => removeGoal(g.id)}
                  aria-label="Remover meta"
                  className="text-mute transition active:text-err"
                >
                  ✕
                </button>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-signal transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </section>

      <section className="space-y-2">
        <h2 className="caps-label font-display font-semibold text-mute">
          Frequência · 13 semanas
        </h2>
        <div className="rounded-lg border border-line bg-surface p-3">
          <Heatmap cells={heatmap} />
        </div>
      </section>

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
                  {nameOf(id)}
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
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3 text-center">
      <p className={`tnum font-display text-xl font-bold ${accent ? "text-signal" : ""}`}>
        {value}
      </p>
      <p className="caps-label mt-0.5 text-mute">{label}</p>
    </div>
  );
}
