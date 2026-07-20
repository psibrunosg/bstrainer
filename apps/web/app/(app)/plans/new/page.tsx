"use client";

import { Suspense, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createManualPlan,
  searchExercises,
  type ExerciseOption,
  type ManualPlanExercise,
} from "@/lib/data/plans";
import { publicAssetPath } from "@/lib/public-asset";

const GOALS: { key: string; label: string }[] = [
  { key: "hypertrophy", label: "Hipertrofia" },
  { key: "strength", label: "Força" },
  { key: "power", label: "Potência" },
  { key: "endurance", label: "Resistência" },
  { key: "health", label: "Saúde" },
  { key: "fat_loss", label: "Emagrecimento" },
];

const LOAD_METHODS: { key: string; label: string }[] = [
  { key: "rpe", label: "RPE" },
  { key: "rir", label: "RIR" },
  { key: "percent_1rm", label: "% 1RM" },
  { key: "absolute", label: "Carga absoluta" },
  { key: "bodyweight", label: "Peso do corpo" },
];

interface DraftExercise extends ManualPlanExercise {
  name: string;
  mediaUrl: string | null;
}

export default function NewManualPlanPage() {
  return (
    <Suspense fallback={null}>
      <NewManualPlanForm />
    </Suspense>
  );
}

function NewManualPlanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("client") ?? undefined;
  const clientName = searchParams.get("name");
  const [goal, setGoal] = useState("hypertrophy");
  const [workoutName, setWorkoutName] = useState("Treino A");
  const [exercises, setExercises] = useState<DraftExercise[]>([]);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ExerciseOption[]>([]);
  const [searching, setSearching] = useState(false);
  const searchSeq = useRef(0);

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const seq = ++searchSeq.current;
    const t = setTimeout(() => {
      searchExercises(term).then((rows) => {
        if (seq !== searchSeq.current) return;
        setResults(rows);
        setSearching(false);
      });
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  function addExercise(opt: ExerciseOption) {
    if (exercises.some((e) => e.exerciseId === opt.id)) {
      setSearch("");
      setResults([]);
      return;
    }
    setExercises((prev) => [
      ...prev,
      {
        exerciseId: opt.id,
        name: opt.name,
        mediaUrl: opt.mediaUrl,
        sets: 3,
        repsMin: 8,
        repsMax: 12,
        loadMethod: "rpe",
        restSeconds: 90,
      },
    ]);
    setSearch("");
    setResults([]);
  }

  function patch(exerciseId: string, next: Partial<ManualPlanExercise>) {
    setExercises((prev) =>
      prev.map((e) => (e.exerciseId === exerciseId ? { ...e, ...next } : e)),
    );
  }

  function remove(exerciseId: string) {
    setExercises((prev) => prev.filter((e) => e.exerciseId !== exerciseId));
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await createManualPlan(
        {
          goal,
          workoutName,
          exercises: exercises.map(({ name: _name, mediaUrl: _mediaUrl, ...rest }) => rest),
        },
        clientId,
      );
      if (result.ok) {
        router.push("/plans");
      } else {
        setError(result.error ?? "Falha ao criar ficha.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      <div>
        <Link
          href="/plans"
          className="text-sm text-mute transition-colors duration-200 hover:text-text"
        >
          ← Fichas
        </Link>
        <h1 className="mt-2 font-display text-[28px] font-extrabold uppercase tracking-tight">
          Nova ficha manual
        </h1>
        <p className="mt-1 text-sm text-mute">
          Um treino, um mesociclo linear de 4 semanas. Monte os exercícios à mão.
        </p>
        {clientId && (
          <p className="mt-2 rounded-lg border border-signal/30 bg-signal/5 px-3 py-2 text-sm text-signal">
            Criando ficha para {clientName ?? "aluno"}
          </p>
        )}
      </div>

      {/* Objetivo + nome do treino */}
      <section className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="goal"
            className="caps-label block font-display font-semibold text-mute"
          >
            Objetivo
          </label>
          <select
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="h-12 w-full rounded border border-line bg-surface px-4 text-base outline-none focus:border-signal"
          >
            {GOALS.map((g) => (
              <option key={g.key} value={g.key}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="workout-name"
            className="caps-label block font-display font-semibold text-mute"
          >
            Nome do treino
          </label>
          <input
            id="workout-name"
            type="text"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="Treino A"
            className="h-12 w-full rounded border border-line bg-surface px-4 text-base outline-none placeholder:text-mute focus:border-signal"
          />
        </div>
      </section>

      {/* Busca de exercícios */}
      <section className="space-y-2">
        <h2 className="caps-label font-display font-semibold text-mute">
          Adicionar exercício
        </h2>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar no catálogo…"
          className="h-12 w-full rounded border border-line bg-surface px-4 text-base outline-none placeholder:text-mute focus:border-signal"
        />
        {search.trim().length >= 2 && (
          <ul className="max-h-64 space-y-px overflow-y-auto rounded-lg border border-line bg-surface p-1">
            {searching && (
              <li className="px-3 py-2 text-sm text-mute">Buscando…</li>
            )}
            {!searching &&
              results.map((r) => (
                <li key={r.id}>
                  {(() => {
                    const mediaSrc = publicAssetPath(r.mediaUrl);
                    return (
                  <button
                    type="button"
                    onClick={() => addExercise(r)}
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
                    <span>{r.name}</span>
                  </button>
                    );
                  })()}
                </li>
              ))}
            {!searching && results.length === 0 && (
              <li className="px-3 py-2 text-sm text-mute">
                Nenhum exercício encontrado.
              </li>
            )}
          </ul>
        )}
      </section>

      {/* Exercícios adicionados */}
      {exercises.length > 0 && (
        <section className="space-y-3">
          <h2 className="caps-label font-display font-semibold text-mute">
            Exercícios · {exercises.length}
          </h2>
          {exercises.map((ex) => (
            <div
              key={ex.exerciseId}
              className="space-y-3 rounded-lg border border-line bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  {publicAssetPath(ex.mediaUrl) && (
                    <img
                      src={publicAssetPath(ex.mediaUrl) ?? ""}
                      alt=""
                      loading="lazy"
                      className="h-14 w-14 shrink-0 rounded border border-line bg-ink object-contain"
                    />
                  )}
                  <h3 className="font-display text-lg font-semibold">{ex.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => remove(ex.exerciseId)}
                  aria-label={`Remover ${ex.name}`}
                  className="h-9 w-9 shrink-0 rounded-lg text-mute transition active:bg-surface-2"
                >
                  ✕
                </button>
              </div>

              {/* Séries (stepper) */}
              <div className="flex items-center justify-between gap-2">
                <span className="caps-label text-mute">Séries</span>
                <div className="flex items-center rounded border border-line bg-ink">
                  <button
                    type="button"
                    onClick={() =>
                      patch(ex.exerciseId, { sets: Math.max(1, ex.sets - 1) })
                    }
                    aria-label="Menos uma série"
                    className="h-11 w-10 font-display text-lg font-bold text-mute transition active:bg-surface-2"
                  >
                    −
                  </button>
                  <span className="tnum w-10 text-center font-display text-lg font-semibold">
                    {ex.sets}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      patch(ex.exerciseId, { sets: ex.sets + 1 })
                    }
                    aria-label="Mais uma série"
                    className="h-11 w-10 font-display text-lg font-bold text-mute transition active:bg-surface-2"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Faixa de reps */}
              <div className="flex items-center justify-between gap-2">
                <span className="caps-label text-mute">Reps</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={ex.repsMin}
                    onChange={(e) =>
                      patch(ex.exerciseId, {
                        repsMin: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    aria-label="Reps mínimas"
                    className="tnum h-11 w-16 rounded border border-line bg-ink text-center font-display text-lg font-semibold outline-none focus:border-signal"
                  />
                  <span className="text-mute">–</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={ex.repsMax}
                    onChange={(e) =>
                      patch(ex.exerciseId, {
                        repsMax: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    aria-label="Reps máximas"
                    className="tnum h-11 w-16 rounded border border-line bg-ink text-center font-display text-lg font-semibold outline-none focus:border-signal"
                  />
                </div>
              </div>

              {/* Método de carga */}
              <div className="flex items-center justify-between gap-2">
                <span className="caps-label text-mute">Carga</span>
                <select
                  value={ex.loadMethod}
                  onChange={(e) =>
                    patch(ex.exerciseId, { loadMethod: e.target.value })
                  }
                  aria-label="Método de carga"
                  className="h-11 rounded border border-line bg-ink px-3 text-sm outline-none focus:border-signal"
                >
                  {LOAD_METHODS.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descanso */}
              <div className="flex items-center justify-between gap-2">
                <span className="caps-label text-mute">Descanso (s)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={15}
                  value={ex.restSeconds}
                  onChange={(e) =>
                    patch(ex.exerciseId, {
                      restSeconds: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  aria-label="Descanso em segundos"
                  className="tnum h-11 w-20 rounded border border-line bg-ink text-center font-display text-lg font-semibold outline-none focus:border-signal"
                />
              </div>
            </div>
          ))}
        </section>
      )}

      {error && <p className="text-sm text-err">{error}</p>}

      <button
        type="button"
        onClick={save}
        disabled={pending || exercises.length === 0}
        className="h-12 w-full rounded-lg bg-signal text-[15px] font-semibold text-ink transition active:scale-[0.98] active:bg-signal-press disabled:opacity-50"
      >
        {pending ? "Criando ficha…" : "Criar ficha"}
      </button>
    </div>
  );
}
