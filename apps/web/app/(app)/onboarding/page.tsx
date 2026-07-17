"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  AthleteLevel,
  AthleteSex,
  TrainingGoal,
  TrainingLocation,
} from "@bstrainer/domain";
import { saveAthleteProfile } from "@/lib/data/athlete";

const GOALS: { key: TrainingGoal; label: string }[] = [
  { key: "hypertrophy", label: "Hipertrofia" },
  { key: "strength", label: "Força" },
  { key: "power", label: "Potência" },
  { key: "endurance", label: "Resistência" },
  { key: "health", label: "Saúde" },
  { key: "fat_loss", label: "Emagrecimento" },
];

const LEVELS: { key: AthleteLevel; label: string }[] = [
  { key: "beginner", label: "Iniciante" },
  { key: "intermediate", label: "Intermediário" },
  { key: "advanced", label: "Avançado" },
];

const LOCATIONS: { key: TrainingLocation; label: string }[] = [
  { key: "home", label: "Casa" },
  { key: "outdoor", label: "Ar livre" },
  { key: "gym", label: "Academia" },
];

const SEXES: { key: AthleteSex; label: string }[] = [
  { key: "male", label: "Masculino" },
  { key: "female", label: "Feminino" },
  { key: "other", label: "Outro" },
];

// ponytail: reuse LoadType keys so this list matches template equipment matching elsewhere.
const EQUIPMENT: { key: string; label: string }[] = [
  { key: "barbell", label: "Barra" },
  { key: "dumbbell", label: "Halteres" },
  { key: "machine", label: "Máquinas" },
  { key: "band", label: "Elásticos" },
  { key: "kettlebell", label: "Kettlebell" },
  { key: "bodyweight", label: "Peso corporal" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [sex, setSex] = useState<AthleteSex | "">("");
  const [birthDate, setBirthDate] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [level, setLevel] = useState<AthleteLevel>("beginner");
  const [goal, setGoal] = useState<TrainingGoal>("hypertrophy");
  const [trainingLocation, setTrainingLocation] = useState<TrainingLocation>("gym");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [equipment, setEquipment] = useState<string[]>([]);

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleEquipment(key: string) {
    setEquipment((prev) =>
      prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key],
    );
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveAthleteProfile({
        sex: sex || null,
        birthDate: birthDate || null,
        weightKg: weightKg ? Number(weightKg) : null,
        heightCm: heightCm ? Number(heightCm) : null,
        level,
        goal,
        trainingLocation,
        daysPerWeek,
        equipment,
      });
      if (result.ok) {
        router.push("/dashboard");
      } else {
        setError(result.error ?? "Falha ao salvar perfil.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      <div>
        <h1 className="font-display text-[28px] font-extrabold uppercase tracking-tight">
          Seu perfil
        </h1>
        <p className="mt-1 text-sm text-mute">
          Conte um pouco sobre você para a gente montar seus treinos.
        </p>
      </div>

      <section className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="sex"
            className="caps-label block font-display font-semibold text-mute"
          >
            Sexo
          </label>
          <select
            id="sex"
            value={sex}
            onChange={(e) => setSex(e.target.value as AthleteSex | "")}
            className="h-12 w-full rounded border border-line bg-surface px-4 text-base outline-none focus:border-signal"
          >
            <option value="">Prefiro não dizer</option>
            {SEXES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="birth-date"
            className="caps-label block font-display font-semibold text-mute"
          >
            Data de nascimento
          </label>
          <input
            id="birth-date"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="h-12 w-full rounded border border-line bg-surface px-4 text-base outline-none placeholder:text-mute focus:border-signal"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="weight"
              className="caps-label block font-display font-semibold text-mute"
            >
              Peso (kg)
            </label>
            <input
              id="weight"
              type="number"
              inputMode="decimal"
              min={0}
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="80"
              className="h-12 w-full rounded border border-line bg-surface px-4 text-base outline-none placeholder:text-mute focus:border-signal"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="height"
              className="caps-label block font-display font-semibold text-mute"
            >
              Altura (cm)
            </label>
            <input
              id="height"
              type="number"
              inputMode="decimal"
              min={0}
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="175"
              className="h-12 w-full rounded border border-line bg-surface px-4 text-base outline-none placeholder:text-mute focus:border-signal"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="level"
            className="caps-label block font-display font-semibold text-mute"
          >
            Nível
          </label>
          <select
            id="level"
            value={level}
            onChange={(e) => setLevel(e.target.value as AthleteLevel)}
            className="h-12 w-full rounded border border-line bg-surface px-4 text-base outline-none focus:border-signal"
          >
            {LEVELS.map((l) => (
              <option key={l.key} value={l.key}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

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
            onChange={(e) => setGoal(e.target.value as TrainingGoal)}
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
            htmlFor="training-location"
            className="caps-label block font-display font-semibold text-mute"
          >
            Onde treina
          </label>
          <select
            id="training-location"
            value={trainingLocation}
            onChange={(e) => setTrainingLocation(e.target.value as TrainingLocation)}
            className="h-12 w-full rounded border border-line bg-surface px-4 text-base outline-none focus:border-signal"
          >
            {LOCATIONS.map((l) => (
              <option key={l.key} value={l.key}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="caps-label font-display font-semibold text-mute">
            Dias por semana
          </span>
          <div className="flex items-center rounded border border-line bg-ink">
            <button
              type="button"
              onClick={() => setDaysPerWeek((d) => Math.max(1, d - 1))}
              aria-label="Menos um dia"
              className="h-11 w-10 font-display text-lg font-bold text-mute transition active:bg-surface-2"
            >
              −
            </button>
            <span className="tnum w-10 text-center font-display text-lg font-semibold">
              {daysPerWeek}
            </span>
            <button
              type="button"
              onClick={() => setDaysPerWeek((d) => Math.min(7, d + 1))}
              aria-label="Mais um dia"
              className="h-11 w-10 font-display text-lg font-bold text-mute transition active:bg-surface-2"
            >
              +
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <span className="caps-label block font-display font-semibold text-mute">
            Equipamentos disponíveis
          </span>
          <div className="grid grid-cols-2 gap-2">
            {EQUIPMENT.map((eq) => (
              <label
                key={eq.key}
                className="flex h-12 items-center gap-2 rounded border border-line bg-surface px-4 text-sm"
              >
                <input
                  type="checkbox"
                  checked={equipment.includes(eq.key)}
                  onChange={() => toggleEquipment(eq.key)}
                />
                {eq.label}
              </label>
            ))}
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-err">{error}</p>}

      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="h-12 w-full rounded-lg bg-signal text-[15px] font-semibold text-ink transition active:scale-[0.98] active:bg-signal-press disabled:opacity-50"
      >
        {pending ? "Salvando…" : "Salvar"}
      </button>
    </div>
  );
}
