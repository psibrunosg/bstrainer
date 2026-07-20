"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isPerformedExercise,
  type PerformedExercise,
  type PerformedSet,
  type WorkoutSession,
} from "@bstrainer/domain";
import { e1rmEpley, sessionTonnage } from "@bstrainer/engine";
import { EXERCISES, exerciseName } from "@/lib/workout/exercises";
import { getSubstitutes } from "@/lib/data/substitutions";
import type { ExerciseOption } from "@/lib/data/plans";
import { syncSession } from "@/lib/workout/sync";
import {
  bestHistoricalE1rm,
  lastPerformanceFor,
  type LastPerformance,
} from "@/lib/workout/history-lookup";
import {
  appendToSessionHistory,
  clearActiveSession,
  loadActiveSession,
  saveActiveSession,
} from "@/lib/workout/storage";
import { PlateCalculator } from "@/components/PlateCalculator";
import { publicAssetPath } from "@/lib/public-asset";
import { shareOrDownloadCard } from "@/lib/workout/share-card";
import { RequireAthlete } from "@/components/RequireAthlete";

const REST_DEFAULT_SEC = 90;
const RPE_OPTIONS = ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"];
const SRPE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface SetDraft {
  reps: number;
  load: string;
  rpe: string;
}

function parseLoad(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function formatKg(kg: number): string {
  return kg % 1 === 0 ? String(kg) : kg.toFixed(1).replace(".", ",");
}

function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function bestE1rm(exercise: PerformedExercise): number {
  let best = 0;
  for (const set of exercise.sets) {
    if (set.isWarmup || set.loadKg == null) continue;
    const e = e1rmEpley(set.loadKg, set.reps);
    if (e > best) best = e;
  }
  return best;
}

export default function TrainSessionPage() {
  return (
    <RequireAthlete>
      <TrainSessionContent />
    </RequireAthlete>
  );
}

function TrainSessionContent() {
  const router = useRouter();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, SetDraft>>({});

  // Última performance por exercício (histórico) — ghost/prefill
  const [lastPerf, setLastPerf] = useState<Record<string, LastPerformance | null>>({});
  // Melhor e1RM histórico por exercício (baseline de PR, congelado no add)
  const prBaseline = useRef<Record<string, number>>({});
  // Exercícios que bateram PR nesta sessão -> valor do PR
  const [prHit, setPrHit] = useState<Record<string, number>>({});

  // Plate calculator
  const [plateTarget, setPlateTarget] = useState<number | null>(null);

  // Timer de descanso
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [restLeft, setRestLeft] = useState(0);
  const [restDone, setRestDone] = useState(false);

  // Finalização
  const [askingSrpe, setAskingSrpe] = useState(false);
  const [finished, setFinished] = useState<WorkoutSession | null>(null);
  const [sharing, setSharing] = useState(false);

  // Substituição de exercício — nome/mídia de substitutos vindos do Supabase
  // podem não estar no catálogo local (EXERCISES), então guardamos override aqui.
  const [substitutePickerFor, setSubstitutePickerFor] = useState<string | null>(null);
  const [substituteOptions, setSubstituteOptions] = useState<ExerciseOption[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [substituteOverride, setSubstituteOverride] = useState<
    Record<string, { name: string; mediaUrl: string | null }>
  >({});

  useEffect(() => {
    loadActiveSession().then(async (active) => {
      setSession(active);
      setLoaded(true);
      // pré-carrega última performance e baseline de PR dos exercícios já na sessão
      if (active) {
        const perf: Record<string, LastPerformance | null> = {};
        for (const ex of active.blocks.filter(isPerformedExercise)) {
          perf[ex.exerciseId] = await lastPerformanceFor(ex.exerciseId);
          prBaseline.current[ex.exerciseId] = await bestHistoricalE1rm(ex.exerciseId);
        }
        setLastPerf(perf);
      }
    });
  }, []);

  useEffect(() => {
    if (session && session.status === "in_progress") {
      // fire-and-forget: escrita no IndexedDB não deve travar o input a cada série
      void saveActiveSession(session);
    }
  }, [session]);

  useEffect(() => {
    if (restEndsAt == null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000));
      setRestLeft(left);
      if (left <= 0) {
        setRestEndsAt(null);
        setRestDone(true);
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.([200, 100, 200]);
        }
      }
    };
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [restEndsAt]);

  useEffect(() => {
    if (!restDone) return;
    const t = setTimeout(() => setRestDone(false), 4000);
    return () => clearTimeout(t);
  }, [restDone]);

  const startRest = useCallback(() => {
    setRestDone(false);
    setRestEndsAt(Date.now() + REST_DEFAULT_SEC * 1000);
  }, []);

  function adjustRest(deltaSec: number) {
    setRestEndsAt((prev) => {
      if (prev == null) return prev;
      return Math.max(Date.now() + 1000, prev + deltaSec * 1000);
    });
  }

  function draftFor(rowId: string, exerciseId: string): SetDraft {
    const existing = drafts[rowId];
    if (existing) return existing;
    const last = lastPerf[exerciseId];
    return { reps: last?.reps ?? 8, load: "", rpe: "" };
  }

  function setDraft(rowId: string, exerciseId: string, patch: Partial<SetDraft>) {
    setDrafts((prev) => ({
      ...prev,
      [rowId]: { ...draftFor(rowId, exerciseId), ...patch },
    }));
  }

  async function addExercise(exerciseId: string) {
    const last = await lastPerformanceFor(exerciseId);
    setLastPerf((prev) => ({ ...prev, [exerciseId]: last }));
    prBaseline.current[exerciseId] = await bestHistoricalE1rm(exerciseId);
    setSession((prev) => {
      if (!prev) return prev;
      const row: PerformedExercise & { kind: "exercise" } = {
        kind: "exercise",
        id: crypto.randomUUID(),
        exerciseId,
        prescribedExerciseId: null,
        order: prev.blocks.length + 1,
        wasSubstituted: false,
        sets: [],
      };
      return { ...prev, blocks: [...prev.blocks, row] };
    });
    setSearch("");
    setShowPicker(false);
  }

  function openSubstitutePicker(rowId: string, exerciseId: string) {
    setSubstitutePickerFor(rowId);
    setSubstituteOptions([]);
    setLoadingSubs(true);
    getSubstitutes(exerciseId).then((opts) => {
      setSubstituteOptions(opts);
      setLoadingSubs(false);
    });
  }

  function closeSubstitutePicker() {
    setSubstitutePickerFor(null);
    setSubstituteOptions([]);
  }

  function applySubstitute(rowId: string, option: ExerciseOption) {
    setSubstituteOverride((prev) => ({
      ...prev,
      [option.id]: { name: option.name, mediaUrl: option.mediaUrl },
    }));
    setSession((prev) => {
      if (!prev) return prev;
      const blocks = prev.blocks.map((e) =>
        e.kind === "exercise" && e.id === rowId
          ? { ...e, exerciseId: option.id, wasSubstituted: true }
          : e,
      );
      return { ...prev, blocks };
    });
    closeSubstitutePicker();
  }

  function removeExercise(rowId: string) {
    setSession((prev) => {
      if (!prev) return prev;
      const blocks = prev.blocks
        .filter((e) => e.id !== rowId)
        .map((e, i) => ({ ...e, order: i + 1 }));
      return { ...prev, blocks };
    });
  }

  function checkPr(exerciseId: string, set: PerformedSet) {
    if (set.loadKg == null) return;
    const e = e1rmEpley(set.loadKg, set.reps);
    const baseline = prBaseline.current[exerciseId] ?? 0;
    const currentSessionBest = prHit[exerciseId] ?? 0;
    if (e > baseline && e > currentSessionBest) {
      setPrHit((prev) => ({ ...prev, [exerciseId]: e }));
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(30);
      }
    }
  }

  function appendSet(
    rowId: string,
    exerciseId: string,
    set: Omit<PerformedSet, "id" | "order">,
  ) {
    const newSet: PerformedSet = { ...set, id: crypto.randomUUID(), order: 0 };
    setSession((prev) => {
      if (!prev) return prev;
      const blocks = prev.blocks.map((e) => {
        if (e.kind !== "exercise" || e.id !== rowId) return e;
        return {
          ...e,
          sets: [...e.sets, { ...newSet, order: e.sets.length + 1 }],
        };
      });
      return { ...prev, blocks };
    });
    checkPr(exerciseId, newSet);
    startRest();
  }

  function confirmSet(rowId: string, exerciseId: string) {
    const d = draftFor(rowId, exerciseId);
    appendSet(rowId, exerciseId, {
      reps: d.reps,
      loadKg: parseLoad(d.load),
      rpe: d.rpe === "" ? null : Number(d.rpe),
      rir: null,
      isFailure: false,
      isWarmup: false,
      timeSeconds: null,
      notes: null,
    });
  }

  function repeatLastSet(exercise: PerformedExercise) {
    const last = exercise.sets[exercise.sets.length - 1];
    if (!last) return;
    appendSet(exercise.id, exercise.exerciseId, {
      reps: last.reps,
      loadKg: last.loadKg,
      rpe: last.rpe,
      rir: last.rir,
      isFailure: false,
      isWarmup: last.isWarmup,
      timeSeconds: last.timeSeconds,
      notes: null,
    });
  }

  function removeSet(rowId: string, setId: string) {
    setSession((prev) => {
      if (!prev) return prev;
      const blocks = prev.blocks.map((e) => {
        if (e.kind !== "exercise" || e.id !== rowId) return e;
        const sets = e.sets
          .filter((s) => s.id !== setId)
          .map((s, i) => ({ ...s, order: i + 1 }));
        return { ...e, sets };
      });
      return { ...prev, blocks };
    });
  }

  async function finishSession(srpe: number) {
    if (!session) return;
    const done: WorkoutSession = {
      ...session,
      finishedAt: new Date().toISOString(),
      status: "completed",
      sessionRpe: srpe,
    };
    await appendToSessionHistory(done);
    await clearActiveSession();
    setAskingSrpe(false);
    setFinished(done);
    setSession(done);
    void syncSession(done);
  }

  // ---- Estados especiais ----

  if (!loaded) {
    return (
      <div className="mx-auto max-w-6xl p-4 lg:p-6">
        <div className="h-14 animate-pulse rounded-lg bg-surface-2" />
      </div>
    );
  }

  if (finished) {
    const durationMin = Math.max(
      1,
      Math.round(
        (Date.parse(finished.finishedAt ?? finished.startedAt) -
          Date.parse(finished.startedAt)) /
          60_000,
      ),
    );
    const finishedExercises = finished.blocks.filter(isPerformedExercise);
    const totalSets = finishedExercises.reduce(
      (acc, e) => acc + e.sets.length,
      0,
    );
    const prCount = Object.keys(prHit).length;
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
          <Stat value={formatKg(sessionTonnage(finished))} label="kg total" />
          <Stat value={String(totalSets)} label="séries" />
        </div>
        <ul className="space-y-px">
          {finishedExercises.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between border-b border-line px-1 py-3 text-sm"
            >
              <span className="text-text">{exerciseName(e.exerciseId)}</span>
              <span className="tnum text-mute">{e.sets.length} séries</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={sharing}
          onClick={async () => {
            setSharing(true);
            try {
              await shareOrDownloadCard(finished, prCount);
            } finally {
              setSharing(false);
            }
          }}
          className="h-12 w-full rounded-lg border border-line bg-surface text-[15px] font-semibold text-text transition active:bg-surface-2 disabled:opacity-50"
        >
          {sharing ? "Gerando…" : "Compartilhar treino"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/train")}
          className="h-12 w-full rounded-lg bg-signal text-[15px] font-semibold text-ink transition active:scale-[0.98] active:bg-signal-press"
        >
          Voltar para Treinar
        </button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-4 lg:p-6">
        <h1 className="font-display text-[28px] font-extrabold uppercase tracking-tight">
          Sessão
        </h1>
        <p className="text-sm text-mute">Nenhum treino em andamento.</p>
        <button
          type="button"
          onClick={() => router.push("/train")}
          className="h-12 w-full rounded-lg bg-signal text-[15px] font-semibold text-ink transition active:scale-[0.98] active:bg-signal-press"
        >
          Ir para Treinar
        </button>
      </div>
    );
  }

  // ---- Sessão ativa ----

  const filtered = EXERCISES.filter((e) =>
    e.name.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")),
  );
  const restActive = restEndsAt != null;
  const restCritical = restActive && restLeft <= 10;

  return (
    <div className="mx-auto max-w-6xl pb-6">
      {/* Timer de descanso fixo no topo */}
      <div
        className={`sticky top-0 z-20 border-b border-line px-4 py-3 backdrop-blur-sm transition-colors lg:px-6 ${
          restDone ? "animate-timer-pulse" : restActive ? "bg-surface-2" : "bg-ink/95"
        }`}
      >
        {restActive ? (
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => adjustRest(-15)}
              className="h-11 rounded-lg border border-line px-3 text-sm font-semibold text-mute transition active:bg-surface-2"
            >
              −15s
            </button>
            <p
              className={`tnum font-display text-4xl font-bold ${
                restCritical ? "text-signal" : "text-text"
              }`}
            >
              {formatClock(restLeft)}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => adjustRest(15)}
                className="h-11 rounded-lg border border-line px-3 text-sm font-semibold text-mute transition active:bg-surface-2"
              >
                +15s
              </button>
              <button
                type="button"
                onClick={() => setRestEndsAt(null)}
                className="h-11 rounded-lg px-3 text-sm text-mute transition active:bg-surface-2"
              >
                Pular
              </button>
            </div>
          </div>
        ) : (
          <div className="flex h-11 items-center justify-between">
            <p className="caps-label font-display font-semibold text-mute">
              {restDone ? "Descanso concluído" : "Treino livre"}
            </p>
            {!restDone && (
              <button
                type="button"
                onClick={startRest}
                className="h-11 rounded-lg border border-line px-4 text-sm font-semibold text-text transition active:bg-surface-2"
              >
                Descanso {REST_DEFAULT_SEC}s
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 p-4 lg:p-6">
        {session.blocks.filter(isPerformedExercise).map((exercise) => {
          const draft = draftFor(exercise.id, exercise.exerciseId);
          const e1rm = bestE1rm(exercise);
          const last = lastPerf[exercise.exerciseId];
          const pr = prHit[exercise.exerciseId];
          const parsedLoad = parseLoad(draft.load);
          const override = substituteOverride[exercise.exerciseId];
          const option = EXERCISES.find((e) => e.id === exercise.exerciseId);
          const displayName = override?.name ?? exerciseName(exercise.exerciseId);
          const mediaSrc = publicAssetPath(override?.mediaUrl ?? option?.mediaUrl);
          return (
            <section
              key={exercise.id}
              className="overflow-hidden rounded-lg border border-line bg-surface lg:grid lg:grid-cols-[minmax(240px,340px)_1fr]"
            >
              {mediaSrc && (
                <div className="border-b border-line bg-ink lg:border-b-0 lg:border-r">
                  <img
                    src={mediaSrc}
                    alt=""
                    loading="lazy"
                    className="h-52 w-full object-contain lg:h-full lg:min-h-[320px]"
                  />
                </div>
              )}

              <div className="space-y-3 p-4 lg:p-5">
              <header className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-semibold">
                    {displayName}
                  </h2>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    {e1rm > 0 && (
                      <span className="tnum text-xs text-mute">
                        e1RM {formatKg(Math.round(e1rm * 10) / 10)} kg
                      </span>
                    )}
                    {last?.loadKg != null && (
                      <span className="tnum text-xs text-mute">
                        Última: {formatKg(last.loadKg)} kg × {last.reps}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openSubstitutePicker(exercise.id, exercise.exerciseId)}
                    aria-label={`Trocar ${displayName}`}
                    className="h-9 w-9 rounded-lg text-mute transition active:bg-surface-2"
                  >
                    ⇄
                  </button>
                  {pr != null ? (
                    <span className="animate-pr-pop rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-gold">
                      PR · {formatKg(Math.round(pr * 10) / 10)} kg
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeExercise(exercise.id)}
                      aria-label={`Remover ${displayName}`}
                      className="h-9 w-9 rounded-lg text-mute transition active:bg-surface-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </header>

              {/* Trocar exercício */}
              {substitutePickerFor === exercise.id && (
                <div className="space-y-2 rounded-lg border border-line bg-ink p-3">
                  <div className="flex items-center justify-between">
                    <p className="caps-label text-mute">Trocar por</p>
                    <button
                      type="button"
                      onClick={closeSubstitutePicker}
                      aria-label="Fechar troca"
                      className="h-8 w-8 rounded text-mute transition active:bg-surface-2"
                    >
                      ✕
                    </button>
                  </div>
                  {loadingSubs && (
                    <p className="px-1 py-2 text-sm text-mute">Buscando…</p>
                  )}
                  {!loadingSubs && substituteOptions.length === 0 && (
                    <p className="px-1 py-2 text-sm text-mute">
                      Sem substitutos cadastrados pra este exercício.
                    </p>
                  )}
                  {!loadingSubs &&
                    substituteOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => applySubstitute(exercise.id, opt)}
                        className="flex min-h-11 w-full items-center gap-3 rounded px-2 py-2 text-left text-sm transition active:bg-surface-2"
                      >
                        {publicAssetPath(opt.mediaUrl) && (
                          <img
                            src={publicAssetPath(opt.mediaUrl) ?? ""}
                            alt=""
                            loading="lazy"
                            className="h-9 w-9 shrink-0 rounded border border-line bg-ink object-contain"
                          />
                        )}
                        <span>{opt.name}</span>
                      </button>
                    ))}
                </div>
              )}

              {/* Séries confirmadas */}
              {exercise.sets.length > 0 && (
                <ul className="space-y-px">
                  {exercise.sets.map((set) => (
                    <li
                      key={set.id}
                      className="grid h-12 grid-cols-[28px_1fr_1fr_40px] items-center gap-2 border-b border-line text-sm last:border-b-0"
                    >
                      <span className="caps-label text-mute">{set.order}</span>
                      <span className="tnum text-center font-display font-semibold">
                        {set.loadKg != null ? `${formatKg(set.loadKg)} kg` : "—"}
                      </span>
                      <span className="tnum text-center font-display font-semibold">
                        {set.reps}
                        {set.rpe != null && (
                          <span className="text-mute"> @{set.rpe}</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSet(exercise.id, set.id)}
                        aria-label={`Remover série ${set.order}`}
                        className="flex h-11 items-center justify-center rounded text-mute transition active:bg-surface-2"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Draft da próxima série */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {/* Stepper de reps */}
                  <div className="flex items-center rounded border border-line bg-ink">
                    <button
                      type="button"
                      onClick={() =>
                        setDraft(exercise.id, exercise.exerciseId, {
                          reps: Math.max(0, draft.reps - 1),
                        })
                      }
                      aria-label="Menos uma repetição"
                      className="h-11 w-10 font-display text-lg font-bold text-mute transition active:bg-surface-2"
                    >
                      −
                    </button>
                    <span className="tnum w-10 text-center font-display text-lg font-semibold">
                      {draft.reps}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft(exercise.id, exercise.exerciseId, {
                          reps: draft.reps + 1,
                        })
                      }
                      aria-label="Mais uma repetição"
                      className="h-11 w-10 font-display text-lg font-bold text-mute transition active:bg-surface-2"
                    >
                      +
                    </button>
                  </div>

                  {/* Carga (toque no ícone abre plate calc) */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={
                        last?.loadKg != null ? formatKg(last.loadKg) : "kg"
                      }
                      value={draft.load}
                      onChange={(e) =>
                        setDraft(exercise.id, exercise.exerciseId, {
                          load: e.target.value,
                        })
                      }
                      className="h-11 w-full rounded border border-line bg-ink px-3 pr-9 text-center font-display text-lg font-semibold outline-none transition-colors placeholder:font-body placeholder:text-base placeholder:font-normal placeholder:text-mute focus:border-signal"
                    />
                    {parsedLoad != null && parsedLoad > 20 && (
                      <button
                        type="button"
                        onClick={() => setPlateTarget(parsedLoad)}
                        aria-label="Calcular anilhas"
                        className="absolute right-1 top-1/2 flex h-9 w-8 -translate-y-1/2 items-center justify-center rounded text-mute transition active:bg-surface-2"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          aria-hidden
                        >
                          <path d="M3 12h2" strokeLinecap="round" />
                          <path d="M19 12h2" strokeLinecap="round" />
                          <rect x="6" y="8" width="3" height="8" rx="0.5" />
                          <rect x="15" y="8" width="3" height="8" rx="0.5" />
                          <path d="M9 12h6" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* RPE */}
                  <select
                    aria-label="RPE da série"
                    value={draft.rpe}
                    onChange={(e) =>
                      setDraft(exercise.id, exercise.exerciseId, {
                        rpe: e.target.value,
                      })
                    }
                    className="h-11 rounded border border-line bg-ink px-2 text-sm outline-none focus:border-signal"
                  >
                    <option value="">RPE</option>
                    {RPE_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => confirmSet(exercise.id, exercise.exerciseId)}
                    className="h-12 flex-1 rounded-lg bg-signal text-sm font-semibold text-ink transition active:scale-[0.98] active:bg-signal-press"
                  >
                    Confirmar série
                  </button>
                  {exercise.sets.length > 0 && (
                    <button
                      type="button"
                      onClick={() => repeatLastSet(exercise)}
                      className="h-12 rounded-lg border border-line px-4 text-sm font-semibold text-text transition active:bg-surface-2"
                    >
                      Repetir
                    </button>
                  )}
                </div>
              </div>
              </div>
            </section>
          );
        })}

        {/* Adicionar exercício */}
        {showPicker ? (
          <section className="space-y-2 rounded-lg border border-line bg-surface p-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Buscar exercício…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded border border-line bg-ink px-3 text-base outline-none placeholder:text-mute focus:border-signal"
              />
              <button
                type="button"
                onClick={() => {
                  setShowPicker(false);
                  setSearch("");
                }}
                aria-label="Fechar busca"
                className="h-11 w-11 rounded-lg text-mute transition active:bg-surface-2"
              >
                ✕
              </button>
            </div>
            <ul className="max-h-64 space-y-px overflow-y-auto lg:grid lg:max-h-[28rem] lg:grid-cols-2 lg:gap-1 lg:space-y-0">
              {filtered.map((e) => (
                <li key={e.id}>
                  {(() => {
                    const mediaSrc = publicAssetPath(e.mediaUrl);
                    return (
                  <button
                    type="button"
                    onClick={() => addExercise(e.id)}
                    className="flex min-h-14 w-full items-center gap-3 rounded px-2 py-2 text-left text-sm transition active:bg-surface-2"
                  >
                    {mediaSrc && (
                      <img
                        src={mediaSrc}
                        alt=""
                        loading="lazy"
                        className="h-11 w-11 shrink-0 rounded border border-line bg-ink object-contain"
                      />
                    )}
                    <span>{e.name}</span>
                  </button>
                    );
                  })()}
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-mute">
                  Nenhum exercício encontrado.
                </li>
              )}
            </ul>
          </section>
        ) : (
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="h-12 w-full rounded-lg border border-dashed border-line text-sm font-semibold text-mute transition active:bg-surface"
          >
            + Adicionar exercício
          </button>
        )}

        {/* Finalizar */}
        {session.blocks.length > 0 && (
          <button
            type="button"
            onClick={() => setAskingSrpe(true)}
            className="h-12 w-full rounded-lg border border-line bg-surface text-[15px] font-semibold text-text transition active:bg-surface-2"
          >
            Finalizar treino
          </button>
        )}
      </div>

      {/* Overlay de sRPE */}
      {askingSrpe && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl space-y-4 rounded-lg border border-line bg-surface p-5 shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
            <div>
              <h2 className="font-display text-xl font-semibold">
                Esforço da sessão
              </h2>
              <p className="mt-1 text-sm text-mute">
                De 0 (repouso) a 10 (máximo), quão pesado foi o treino inteiro?
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {SRPE_OPTIONS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => finishSession(v)}
                  className="tnum h-12 rounded border border-line bg-ink font-display text-base font-semibold transition active:border-signal active:bg-signal/10"
                >
                  {v}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setAskingSrpe(false)}
              className="h-11 w-full rounded-lg text-sm text-mute transition active:bg-surface-2"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Plate calculator */}
      {plateTarget != null && (
        <PlateCalculator
          targetKg={plateTarget}
          onClose={() => setPlateTarget(null)}
        />
      )}
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
