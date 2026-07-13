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
      <h1 className="font-display text-[28px] font-extrabold uppercase tracking-tight">
        Templates
      </h1>
      <p className="text-sm leading-relaxed text-mute">
        Modelos baseados em literatura de treinamento. Escolha um e o sistema
        monta a ficha pro seu equipamento.
      </p>
      <ul className="space-y-3">
        {templateLibrary.map((t) => (
          <li key={t.id}>
            <Link
              href={`/plans/templates/${t.id}`}
              className="block rounded-lg border border-line bg-surface p-4 transition-colors duration-200 hover:bg-surface-2"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-text">{t.name}</h2>
                <span className="tnum shrink-0 rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-[11px] font-semibold text-mute">
                  {t.daysPerWeek}x/sem
                </span>
              </div>
              <p className="caps-label mt-1 text-mute">
                {GOAL_LABEL[t.goal] ?? t.goal} ·{" "}
                {LEVEL_LABEL[t.level] ?? t.level}
              </p>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-mute">
                {t.rationale}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
