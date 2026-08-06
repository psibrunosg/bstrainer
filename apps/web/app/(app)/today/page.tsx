"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Readiness, WorkoutSession, WorkoutBlock } from "@bstrainer/domain";
import { suggestAdjustment, weeklyStreak, sessionTonnage } from "@bstrainer/engine";
import {
  loadActiveSession,
  saveActiveSession,
  createFreeSession,
  startSessionFromTemplate,
} from "@/lib/workout/storage";
import { loadSessions } from "@/lib/data/sessions";
import { getActivePlanWorkouts, type ActivePlanWorkouts, type NextWorkout } from "@/lib/data/active-plan";
import { RequireAthlete } from "@/components/RequireAthlete";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const TIME_OPTIONS = [
  { label: "30m", value: 30 },
  { label: "45m", value: 45 },
  { label: "60m", value: 60 },
  { label: "90m+", value: 90 },
];

export default function TodayPage() {
  const router = useRouter();
  const [active, setActive] = useState<WorkoutSession | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [planData, setPlanData] = useState<ActivePlanWorkouts | null>(null);
  const [readiness, setReadiness] = useState<Readiness>({
    sleep: 4,
    soreness: 2,
    energy: 4,
  });
  const [availableMinutes, setAvailableMinutes] = useState(60);
  const [deloadWarning, setDeloadWarning] = useState<string | null>(null);
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);
  const [weeklyTonnageValue, setWeeklyTonnageValue] = useState(0);
  const [sessionsThisWeek, setSessionsThisWeek] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    async function loadData() {
      const activeS = await loadActiveSession();
      setActive(activeS);

      const pData = await getActivePlanWorkouts();
      setPlanData(pData);
      if (pData?.nextWorkoutId) {
        setOpenAccordionId(pData.nextWorkoutId);
      } else if (pData?.workouts[0]) {
        setOpenAccordionId(pData.workouts[0].template.id);
      }

      const sessions = await loadSessions();
      setStreak(weeklyStreak(sessions));

      const cutoff = Date.now() - WEEK_MS;
      let thisWeekCount = 0;
      let thisWeekTonnage = 0;
      for (const s of sessions) {
        if (Date.parse(s.startedAt) >= cutoff) {
          thisWeekCount += 1;
          thisWeekTonnage += sessionTonnage(s);
        }
      }
      setSessionsThisWeek(thisWeekCount);
      setWeeklyTonnageValue(Math.round(thisWeekTonnage));
      setLoaded(true);
    }
    loadData();
  }, []);

  useEffect(() => {
    const { recommendation, reason } = suggestAdjustment({
      readiness,
      lastSessionRpe: null,
      recentE1rmTrend: null,
    });
    if (recommendation === "deload") {
      setDeloadWarning(reason);
    } else {
      setDeloadWarning(null);
    }
  }, [readiness]);

  const nextWorkout = planData?.workouts.find(
    (w) => w.template.id === planData.nextWorkoutId
  ) || planData?.workouts[0];

  async function handleStartWorkout(workout: NextWorkout | undefined) {
    if (active) {
      router.push("/train/session");
      return;
    }
    if (workout) {
      const session = startSessionFromTemplate(workout.template);
      await saveActiveSession({ ...session, readiness });
    } else {
      const session = createFreeSession();
      await saveActiveSession({ ...session, readiness });
    }
    router.push("/train/session");
  }

  return (
    <RequireAthlete>
      <div className="mx-auto max-w-md space-y-6 p-4 text-text">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="caps-label font-display font-semibold text-signal">
              Matilha em Movimento
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">
              Hoje
            </h1>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-signal/30 bg-signal/10 px-3 py-1 text-xs font-semibold text-signal">
              <span>🔥</span>
              <span>{streak} sem</span>
            </div>
          )}
        </div>

        {!loaded ? (
          <div className="space-y-4">
            <div className="h-44 rounded-xl skeleton-shimmer" />
            <div className="h-32 rounded-xl skeleton-shimmer" />
            <div className="h-40 rounded-xl skeleton-shimmer" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Card 1: O que tem para hoje (Treino do Dia) */}
            <div className="relative overflow-hidden rounded-xl border border-line bg-surface p-5 shadow-sm transition-all duration-200">
              <div aria-hidden className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-signal/10 blur-xl pointer-events-none" />
              
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <span className="caps-label font-display text-xs font-bold uppercase tracking-wider text-mute">
                    {active ? "Treino em Andamento" : "Treino do Dia"}
                  </span>
                  <h2 className="mt-1 font-display text-2xl font-bold text-text">
                    {active
                      ? active.workoutTemplateId
                        ? nextWorkout?.template.name || "Sessão Ativa"
                        : "Treino Livre Ativo"
                      : nextWorkout
                        ? nextWorkout.template.name
                        : "Treino Livre"}
                  </h2>
                </div>
                {nextWorkout && !active && (
                  <span className="rounded-md border border-line bg-surface-2 px-2.5 py-1 text-xs font-medium text-mute">
                    ~{Math.max(30, nextWorkout.template.blocks.length * 12)} min
                  </span>
                )}
              </div>

              <p className="relative z-10 mt-2 text-sm text-mute">
                {active
                  ? "Sua sessão já foi iniciada no aparelho. Retome para continuar gravando suas séries."
                  : nextWorkout
                    ? `${nextWorkout.template.blocks.length} blocos programados na sua ficha ativa.`
                    : "Você ainda não possui um programa ativo hoje. Comece com um treino livre ou escolha um template!"}
              </p>

              <button
                type="button"
                onClick={() => handleStartWorkout(nextWorkout)}
                className="relative z-10 mt-5 flex min-h-[52px] w-full items-center justify-center rounded-lg bg-signal px-6 text-base font-bold text-ink transition active:scale-[0.98] active:bg-signal-press shadow-md shadow-signal/10"
              >
                {active
                  ? "Continuar Treino Ativo →"
                  : deloadWarning
                    ? "Iniciar Treino de Hoje (Deload Recom.)"
                    : nextWorkout
                      ? `Iniciar Treino de Hoje`
                      : "Começar Treino Livre"}
              </button>
            </div>

            {/* Card 2: Check-in Diário */}
            <div className="rounded-xl border border-line bg-surface p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-bold text-text">
                    Check-in Diário
                  </h3>
                  <p className="text-xs text-mute">
                    Ajuste instantâneo do motor para sua prontidão hoje
                  </p>
                </div>
                <span className="text-xs font-semibold text-signal">Rápido</span>
              </div>

              {/* Energia */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-mute">
                  <span>Energia física</span>
                  <span className="tnum font-medium text-text">{readiness.energy ?? "-"} / 5</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setReadiness((prev) => ({ ...prev, energy: val }))}
                      className={`flex h-11 items-center justify-center rounded-lg border text-sm font-bold transition active:scale-95 ${
                        readiness.energy === val
                          ? "border-signal bg-signal text-ink shadow-sm"
                          : "border-line bg-ink text-mute hover:border-text/30"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dor muscular / Soreness */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-mute">
                  <span>Dor muscular / fadiga</span>
                  <span className="tnum font-medium text-text">{readiness.soreness ?? "-"} / 5</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setReadiness((prev) => ({ ...prev, soreness: val }))}
                      className={`flex h-11 items-center justify-center rounded-lg border text-sm font-bold transition active:scale-95 ${
                        readiness.soreness === val
                          ? "border-signal bg-signal text-ink shadow-sm"
                          : "border-line bg-ink text-mute hover:border-text/30"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tempo Disponível */}
              <div className="space-y-1.5">
                <span className="block text-xs text-mute">Tempo disponível hoje</span>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAvailableMinutes(opt.value)}
                      className={`flex h-11 items-center justify-center rounded-lg border text-sm font-bold transition active:scale-95 ${
                        availableMinutes === opt.value
                          ? "border-signal bg-signal text-ink shadow-sm"
                          : "border-line bg-ink text-mute hover:border-text/30"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {deloadWarning && (
                <div className="rounded-lg border border-err/40 bg-err/10 p-3 text-xs text-err font-medium">
                  ⚠️ Sinal de fadiga detectado ({deloadWarning}). O motor sugere realizar as séries com mais repetições em reserva (RIR +1) hoje.
                </div>
              )}
            </div>

            {/* Card 3: Sua Ficha (Accordion por Bloco) */}
            <div className="rounded-xl border border-line bg-surface p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-bold text-text">
                    Sua Ficha
                  </h3>
                  <p className="text-xs text-mute">
                    {planData ? `${planData.workouts.length} treinos no mesociclo atual` : "Nenhum programa vinculado"}
                  </p>
                </div>
                <Link href="/plans" className="text-xs font-semibold text-signal hover:underline">
                  Ver Fichas
                </Link>
              </div>

              {planData && planData.workouts.length > 0 ? (
                <div className="space-y-2">
                  {planData.workouts.map((workout) => {
                    const isNext = workout.template.id === planData.nextWorkoutId;
                    const isOpen = openAccordionId === workout.template.id;

                    return (
                      <div
                        key={workout.template.id}
                        className={`overflow-hidden rounded-lg border transition-all duration-200 ${
                          isNext ? "border-signal/50 bg-ink/70" : "border-line bg-ink"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenAccordionId(isOpen ? null : workout.template.id)}
                          className="flex w-full items-center justify-between p-3 text-left transition hover:bg-surface-2/50"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`h-2 w-2 rounded-full ${isNext ? "bg-signal animate-pulse" : "bg-mute"}`} />
                            <span className="font-display font-semibold text-sm text-text">
                              {workout.template.name}
                            </span>
                            {isNext && (
                              <span className="rounded-full bg-signal/20 px-2 py-0.5 text-[10px] font-bold uppercase text-signal">
                                Hoje
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-mute">
                            {isOpen ? "▲" : "▼"}
                          </span>
                        </button>

                        {isOpen && (
                          <div className="border-t border-line/60 bg-surface/40 p-3 space-y-3 animate-in fade-in duration-200">
                            <div className="space-y-1.5 text-xs text-mute">
                              {workout.template.blocks.map((block, idx) => {
                                if (block.kind === "exercise") {
                                  return (
                                    <div key={block.id} className="flex justify-between items-center py-1 border-b border-line/30 last:border-0">
                                      <span className="text-text font-medium">
                                        {idx + 1}. Exercício de Força
                                      </span>
                                      <span className="tnum text-mute">
                                        {block.sets.length} séries ({block.sets[0]?.repsMin}-{block.sets[0]?.repsMax} reps)
                                      </span>
                                    </div>
                                  );
                                } else if (block.kind === "activity") {
                                  const info = workout.activityInfo[block.activityId];
                                  return (
                                    <div key={block.id} className="flex justify-between items-center py-1 border-b border-line/30 last:border-0">
                                      <span className="text-text font-medium">
                                        {idx + 1}. {info?.name || "Atividade Cardio"}
                                      </span>
                                      <span className="tnum text-mute">
                                        {block.durationSeconds ? `${Math.round(block.durationSeconds / 60)} min` : "Livre"}
                                      </span>
                                    </div>
                                  );
                                }
                                return (
                                  <div key={block.id} className="py-1 text-text font-medium">
                                    {idx + 1}. Circuito ({block.rounds} rounds)
                                  </div>
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleStartWorkout(workout)}
                              className="flex h-10 w-full items-center justify-center gap-1.5 rounded bg-surface-2 px-4 text-xs font-bold text-text transition hover:bg-signal hover:text-ink active:scale-[0.99]"
                            >
                              <span>▶ Iniciar {workout.template.name}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-line bg-ink p-4 text-center space-y-2">
                  <p className="text-xs text-mute">
                    Explore nossa biblioteca de periodizações da literatura para adicionar um plano com treinos A, B, C...
                  </p>
                  <Link
                    href="/plans/templates"
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-surface-2 px-4 text-xs font-semibold text-signal transition active:scale-95 hover:bg-surface"
                  >
                    Escolher Template de Ficha →
                  </Link>
                </div>
              )}
            </div>

            {/* Card 4: Evolução Rápida */}
            <div className="rounded-xl border border-line bg-surface p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-bold text-text">
                    Evolução Rápida
                  </h3>
                  <p className="text-xs text-mute">
                    Resumo do seu progresso acumulado esta semana
                  </p>
                </div>
                <Link
                  href="/dashboard"
                  className="text-xs font-semibold text-signal hover:underline"
                >
                  Ver Gráficos →
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-line bg-ink p-3.5 text-center">
                  <p className="tnum font-display text-2xl font-extrabold text-signal">
                    {weeklyTonnageValue < 1000
                      ? `${weeklyTonnageValue} kg`
                      : `${(weeklyTonnageValue / 1000).toFixed(1)} t`}
                  </p>
                  <p className="caps-label mt-1 text-[10px] text-mute">
                    Tonelagem Semanal
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-ink p-3.5 text-center">
                  <p className="tnum font-display text-2xl font-extrabold text-text">
                    {sessionsThisWeek} {sessionsThisWeek === 1 ? "sessão" : "sessões"}
                  </p>
                  <p className="caps-label mt-1 text-[10px] text-mute">
                    Treinos Concluídos
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-ink px-3.5 py-2.5 text-xs text-mute border border-line/40">
                <span>Consistência Semanal</span>
                <span className="font-semibold text-text">
                  {sessionsThisWeek > 0 ? "Em dia!" : "Ainda não treinou esta semana"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireAthlete>
  );
}
