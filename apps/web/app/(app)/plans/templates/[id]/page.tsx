import Link from "next/link";
import { notFound } from "next/navigation";
import { getTemplate, templateLibrary } from "@bstrainer/engine";
import { UseTemplateButton } from "@/components/UseTemplateButton";

export function generateStaticParams() {
  return templateLibrary.map((t) => ({ id: t.id }));
}

const EMPHASIS_LABEL: Record<string, string> = {
  hypertrophy: "Hipertrofia",
  strength: "Força",
  power: "Potência",
  deload: "Deload",
  intro: "Introdução",
};

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const template = getTemplate(id);
  if (!template) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-5 p-4">
      <div>
        <Link
          href="/plans/templates"
          className="text-sm text-mute transition-colors duration-200 hover:text-text"
        >
          ← Templates
        </Link>
        <h1 className="mt-2 font-display text-[28px] font-extrabold uppercase tracking-tight">
          {template.name}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          {template.rationale}
        </p>
      </div>

      <div className="rounded-lg border border-line bg-surface p-4">
        <h2 className="caps-label font-display font-semibold text-mute">
          Regra de progressão
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text">
          {template.progressionRule}
        </p>
      </div>

      {template.mesocycles.map((meso, i) => (
        <section key={i} className="space-y-3">
          <h2 className="caps-label font-display font-semibold text-mute">
            Mesociclo {i + 1} · {meso.weeks} semanas ·{" "}
            {EMPHASIS_LABEL[meso.emphasis] ?? meso.emphasis}
          </h2>
          {meso.workouts.map((w) => (
            <div
              key={w.name}
              className="rounded-lg border border-line bg-surface p-4"
            >
              <h3 className="font-semibold text-text">{w.name}</h3>
              <ul className="mt-2">
                {w.exercises.map((ex, j) => (
                  <li
                    key={j}
                    className="flex justify-between border-b border-line py-1.5 text-sm last:border-b-0"
                  >
                    <span className="text-text">{ex.suggestedVariant}</span>
                    <span className="tnum text-mute">
                      {ex.setScheme.setCount}×{ex.setScheme.repsMin}
                      {ex.setScheme.repsMax !== ex.setScheme.repsMin &&
                        `–${ex.setScheme.repsMax}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}

      <UseTemplateButton templateId={template.id} />
    </div>
  );
}
