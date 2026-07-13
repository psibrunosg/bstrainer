import Link from "next/link";
import { templateLibrary } from "@bstrainer/engine";

const GOAL_LABEL: Record<string, string> = {
  hypertrophy: "Hipertrofia",
  strength: "Força",
  power: "Potência",
  endurance: "Resistência",
  health: "Saúde",
  fat_loss: "Emagrecimento",
};

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="text-2xl font-bold">Templates de periodização</h1>
      <p className="text-sm text-zinc-400">
        Modelos baseados em literatura de treinamento. Escolha um e o sistema
        monta a ficha pro seu equipamento.
      </p>
      <ul className="space-y-3">
        {templateLibrary.map((t) => (
          <li key={t.id}>
            <Link
              href={`/plans/templates/${t.id}`}
              className="block rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition hover:border-zinc-600"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{t.name}</h2>
                <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                  {t.daysPerWeek}x/sem
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {GOAL_LABEL[t.goal] ?? t.goal} ·{" "}
                {LEVEL_LABEL[t.level] ?? t.level}
              </p>
              <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
                {t.rationale}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
